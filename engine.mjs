function num(object,key,fallback=0) {
  const v=object && object[key]!==undefined?object[key]:fallback;
  if(typeof v!=="number" || !Number.isFinite(v)) throw new Error("Parâmetro numérico inválido: "+key);
  return v;
}

function rateMonthly(annual) {
  if(!Number.isFinite(annual) || annual<=-1) throw new Error("Taxa anual inválida");
  return Math.pow(1+annual,1/12)-1;
}

function payment(principal, monthlyRate, months, system, monthNumber) {
  if(principal<=0 || monthNumber>months || months<1) return 0;
  if(system==="sac") return principal/months + (principal-(monthNumber-1)*principal/months)*monthlyRate;
  if(monthlyRate===0) return principal/months;
  return principal*monthlyRate/(1-Math.pow(1+monthlyRate,-months));
}

function validate(config) {
  if(!config || typeof config!=="object" || Array.isArray(config)) throw new Error("Configuração JSON inválida");
  const months=num(config,"months",60),cash=num(config,"initialCash",0);
  if(!Number.isInteger(months)||months<1||months>600) throw new Error("Horizonte deve ter de 1 a 600 meses");
  if(cash<0) throw new Error("Capital inicial não pode ser negativo");
  const p=config.property||{},r=config.rent||{},s=config.sale||{};
  if(num(p,"price",0)<=0) throw new Error("Preço do imóvel deve ser positivo");
  if(num(r,"monthly",0)<0) throw new Error("Aluguel não pode ser negativo");
  rateMonthly(num(r,"annualIncrease",0));
  if(num(r,"deposit",0)<0)throw new Error("Caução não pode ser negativa");
  rateMonthly(num(r,"depositAnnualReturn",0));
  if(num(s,"discountRate",0)<0||num(s,"commissionRate",0)<0||num(s,"discountRate",0)+num(s,"commissionRate",0)>=1) throw new Error("Taxas de venda inválidas");
  ["investmentAnnualNet","inflationAnnual","negativeCashAnnualRate"].forEach(k=>rateMonthly(num(config,k,k==="negativeCashAnnualRate"?0.18:0)));
  ["appreciationRealAnnual","neighborhoodRealAnnual","propertyRealAnnual"].forEach(k=>rateMonthly(num(p,k,0)));
  if(config.mortgage) {const x=config.mortgage;if(!["price","sac"].includes(x.system||"price")) throw new Error("Sistema de financiamento desconhecido");if(num(x,"downPayment",0)<0||num(x,"downPayment",0)>num(p,"price"))throw new Error("Entrada inválida");if(!Number.isInteger(num(x,"months",360))||num(x,"months",360)<1)throw new Error("Prazo inválido");rateMonthly(num(x,"annualInterestRate",0));rateMonthly(num(x,"annualIndexRate",0));}
  if(config.seller){const x=config.seller;if(num(x,"downPayment",0)<0||num(x,"downPayment",0)>num(p,"price"))throw new Error("Entrada inválida");rateMonthly(num(x,"annualInterestRate",0));}
  if(config.consortium){const x=config.consortium;if(num(x,"credit",0)<0||num(x,"remainingDebt",0)<0||num(x,"credit",0)>num(p,"price"))throw new Error("Crédito de consórcio inválido");}
  return true;
}

function baseline(config) {
  let v=num(config,"initialCash"),r=rateMonthly(num(config,"investmentAnnualNet",0)),b=rateMonthly(num(config,"negativeCashAnnualRate",0.18));
  for(let m=1;m<=num(config,"months",60);m++)v=v*(1+(v>=0?r:b))+num(config,"monthlyContribution",0);
  return v;
}

function progressiveCapitalGainsTax(gain) {
  let remaining=Math.max(0,gain),tax=0;
  const brackets=[[5000000,.15],[5000000,.175],[20000000,.20],[Infinity,.225]];
  for(const [width,rate] of brackets){
    const slice=Math.min(width,remaining);tax+=slice*rate;remaining-=slice;
    if(remaining<=0)break;
  }
  return tax;
}
function rentalEarlyExitPenalty(rent,horizon) {
  if(rent.penaltyMode!=="proportional")return num(rent,"earlyExitPenalty",0);
  const months=num(rent,"contractMonths",horizon),fullPenaltyMonths=num(rent,"contractPenaltyMonths",3);
  if(!Number.isInteger(months)||months<=0)throw new Error("Prazo de contrato de aluguel inválido");
  if(fullPenaltyMonths<0)throw new Error("Multa contratual inválida");
  return num(rent,"monthly")*fullPenaltyMonths*Math.max(0,months-horizon)/months;
}

function project(config, kind) {
  validate(config);
  if(!["rent","cash","mortgage","seller","consortium"].includes(kind))throw new Error("Estratégia desconhecida: "+kind);
  const N=num(config,"months",60),price=num(config.property,"price"),p=config.property||{},r=config.rent||{},loan=config.mortgage||{},seller=config.seller||{},cons=config.consortium||{},sale=config.sale||{};
  const annualGrowth=(1+num(config,"inflationAnnual"))*(1+num(p,"appreciationRealAnnual"))*(1+num(p,"neighborhoodRealAnnual"))*(1+num(p,"propertyRealAnnual"))-1;
  const growth=rateMonthly(annualGrowth), interest=rateMonthly(num(config,"investmentAnnualNet")), overdraft=rateMonthly(num(config,"negativeCashAnnualRate",0.18));
  const inflation=rateMonthly(num(config,"inflationAnnual"));
  const isOwner=kind!=="rent",cashStart=num(config,"initialCash"),inflow=num(config,"monthlyContribution");
  const state={cash:cashStart,property:0,debt:0,deposit:0,marketBasis:0,taxBasis:0,loanMonth:0,principal:0,rate:0,originalMonths:0,originalPayment:0,system:"price"};
  const ledger=[],months=[],warnings=[],renovations=Array.isArray(p.renovations)?p.renovations:[];
  const note=(m,type,amount,description)=>{
    if(!Number.isFinite(amount))throw new Error("Lançamento inválido: "+type);
    if(Math.abs(amount)<0.0000001)return;
    state.cash+=amount;
    ledger.push({month:m,category:type,amount,description:description||type});
  };
  const costEntry=num(p,"acquisitionFixed",0)+price*num(p,"acquisitionRate",0)+num(p,"initialRenovation",0)+num(p,"initialFurnishing",0);
  const taxFee=num(p,"acquisitionFixed",0)+price*num(p,"acquisitionRate",0);
  for(let m=0;m<=N;m++){
    if(m>0){
      if(kind==="rent" && state.deposit>0)state.deposit*=1+rateMonthly(num(r,"depositAnnualReturn",0));
      note(m,state.cash>=0?"investment-return":"funding-interest",state.cash*(state.cash>=0?interest:overdraft),"Rendimento líquido ou custo de cobertura do caixa");
      note(m,"income",inflow,"Aporte externo comum a todas as estratégias");
    }
    if(m===0 && isOwner){
      state.property=num(p,"marketValue",price)+num(p,"initialRenovation",0)*num(p,"initialRenovationValueRate",0);
      state.taxBasis=price+taxFee+num(p,"initialRenovation",0);
      if(kind==="cash")note(m,"purchase",-(price+costEntry),"Aquisição à vista e custos iniciais");
      if(kind==="mortgage"||kind==="seller"){
        const l=kind==="mortgage"?loan:seller;
        const down=num(l,"downPayment",price*0.2);
        state.principal=price-down;state.debt=state.principal;state.originalMonths=num(l,"months",kind==="mortgage"?360:60);
        state.rate=rateMonthly(num(l,"annualInterestRate"));state.system=l.system||"price";
        state.originalPayment=payment(state.principal,state.rate,state.originalMonths,state.system,1);
        note(m,"purchase",-(down+costEntry+num(l,"fees",0)),"Entrada, despesas de aquisição e crédito contratual");
      }
      if(kind==="consortium"){
        state.debt=num(cons,"remainingDebt",0);
        state.originalMonths=num(cons,"months",1);
        state.principal=state.debt;
        note(m,"purchase",-(price-num(cons,"credit",0)+num(cons,"shareAcquisitionPrice",0)+num(cons,"transferFee",0)+costEntry),"Complemento, aquisição da cota, cessão e despesas");
        if(state.debt>0 && state.originalMonths<=0)throw new Error("Prazo de consórcio inválido");
        if(num(cons,"remainingDebt",0)===0 && num(cons,"credit",0)>0)warnings.push("Carta sem dívida residual informada: confirmar quitação e transferência.");
      }
    }
    if(m===0 && kind==="rent"){
      const deposit=num(r,"deposit"),fees=num(r,"upfrontCosts");
      state.deposit=deposit;
      note(m,"deposit",-deposit,"Caução recuperável (capital vinculado)");
      note(m,"rent-entry",-fees,"Custos iniciais de locação");
    }
    if(m>0 && isOwner){
      state.property*=(1+growth);
      if(kind==="mortgage"||kind==="seller"){
        const l=kind==="mortgage"?loan:seller;
        if(state.debt>0){
          if(m>1 && (m-1)%12===0)state.debt*=1+num(l,"annualIndexRate",kind==="seller"?num(l,"annualCorrectionRate",0):0);
          const accrued=state.debt*state.rate,scheduled=state.system==="sac"?
            Math.min(state.debt,state.principal/state.originalMonths)+accrued:
            Math.min(state.debt+accrued,state.originalPayment);
          const principalPaid=Math.max(0,Math.min(state.debt,scheduled-accrued));
          state.debt-=principalPaid;
          note(m,"loan-interest",-accrued,"Juros do saldo devedor");
          note(m,"loan-principal",-principalPaid,"Amortização do principal");
          const extra=Array.isArray(l.extraPayments)?l.extraPayments.filter(x=>x.month===m).reduce((a,x)=>a+num(x,"amount"),0):0;
          if(extra>0){const paid=Math.min(extra,state.debt);state.debt-=paid;note(m,"extra-amortization",-paid,"Amortização extraordinária");}
          note(m,"loan-charges",-num(l,"insuranceMonthly",0),"Seguro de financiamento");
        }
      }
      if(kind==="consortium" && state.debt>0){
        if(m>1&&(m-1)%12===0)state.debt*=1+num(cons,"annualIndexRate",0);
        const remaining=Math.max(1,state.originalMonths-m+1);
        const paid=Math.min(state.debt,state.debt/remaining);
        state.debt-=paid;
        note(m,"consortium-principal",-paid,"Parcela do saldo da carta");
        note(m,"consortium-charges",-num(cons,"monthlyOtherCharges",0),"Encargos adicionais informados da carta");
      }
      note(m,"condominium",-num(p,"condoMonthly",0),"Condomínio ordinário");
      note(m,"property-tax",-num(p,"iptuMonthly",0),"IPTU provisionado conforme calendário informado");
      note(m,"insurance",-num(p,"insuranceMonthly",0),"Seguro residencial");
      note(m,"maintenance",-num(p,"maintenanceMonthly",0),"Manutenção recorrente");
      const yearly=(m-1)%12===0;
      if(yearly)note(m,"extra-costs",-num(p,"annualExtraCosts",0),"Despesas anuais, conforme calendário");
    }
    if(kind==="rent"){
      if((m>0)|| (m===0 && r.prepaid===true)){
        if(!(m===N && r.prepaid===true)){
          const indexMonth=m===0?0:m-1;
          const rentAmount=num(r,"monthly")*Math.pow(1+num(r,"annualIncrease",0),Math.floor(indexMonth/12));
          note(m,"rent",-rentAmount,"Aluguel contratual");
        }
      }
      if(m>0){
        note(m,"renter-condo",-num(r,"condoMonthly",0),"Condomínio pago pelo locatário");
        note(m,"renter-tax",-num(r,"iptuMonthly",0),"IPTU contratualmente pago pelo locatário");
        note(m,"renter-insurance",-num(r,"insuranceMonthly",0),"Seguro e taxas do locatário");
        note(m,"renter-maintenance",-num(r,"maintenanceMonthly",0),"Reparos do locatário");
      }
    }
    if(isOwner){
      for(const event of renovations){
        if(num(event,"month",-1)===m){
          const cost=num(event,"cost");
          if(cost<0)throw new Error("Custo de obra negativo");
          note(m,"renovation",-cost,"Obra ou melhoria");
          state.property+=cost*num(event,"marketRecoveryRate",0);
          if(event.taxBasisEligible===true)state.taxBasis+=cost;
        }
      }
    }
    if(m===N && isOwner && sale.sellAtEnd!==false){
      const grossPrice=state.property*(1-num(sale,"discountRate",0));
      const sold=grossPrice-state.property*num(sale,"commissionRate",0)-num(sale,"fixedCosts",0);
      const gain=Math.max(0,sold-state.taxBasis);
      const qualifiesOnlyHome=sale.onlyProperty===true && sale.noSalePast5Years===true && grossPrice<=440000;
      const gainTax=qualifiesOnlyHome?0:
        sale.taxPolicy==="progressive"?progressiveCapitalGainsTax(gain):
        num(sale,"capitalGainsTaxRate",0)*gain;
      note(m,"sale",sold,"Receita de venda líquida de corretagem e descontos");
      note(m,"capital-gains-tax",-gainTax,"Tributo hipotético parametrizado; verificar isenções");
      if(state.debt>0){note(m,"debt-payoff",-state.debt,"Quitação das obrigações na alienação");state.debt=0;}
      state.property=0;
      if(qualifiesOnlyHome)warnings.push("Isenção de único imóvel (até R$ 440 mil) simulada com declarações do usuário; validar condições legais.");
      else if(sale.taxPolicy!=="progressive"&&num(sale,"capitalGainsTaxRate",0)===0)warnings.push("IR de ganho de capital não parametrizado: valor zero não confirma isenção.");
      else if(sale.taxPolicy==="progressive")warnings.push("IR progressivo ilustrativo: fatores legais de redução, reinvestimento em 180 dias e demais isenções não estão automatizados.");
    }
    if(m===N && kind==="rent"){
      note(m,"deposit-return",state.deposit*(1+num(r,"depositReturnRate",0)),"Restituição da caução");
      state.deposit=0;
      note(m,"rent-exit",-num(r,"exitCosts",0)-rentalEarlyExitPenalty(r,N),"Custos e multa de saída informados");
    }
    months.push({month:m,cash:state.cash,property:state.property,debt:state.debt,deposit:state.deposit,netWorth:state.cash+state.property+state.deposit-state.debt,realNetWorth:(state.cash+state.property+state.deposit-state.debt)/Math.pow(1+inflation,m),shortfall:Math.max(0,num(config,"minimumReserve",0)-state.cash)});
  }
  if(months.some(x=>x.shortfall>0))warnings.push("Caixa caiu abaixo da reserva mínima; verificar disponibilidade/financiamento de déficits.");
  if(kind==="consortium")warnings.push("Carta contemplada: conferir regulamento, encargos, liberação, transferência e garantias.");
  const baseCashFuture=baseline(config),final=months[months.length-1];
  const equivalentFactor=interest===0?N:(Math.pow(1+interest,N)-1)/interest;
  return {kind,horizonMonths:N,ledger,months,summary:{netWorth:final.netWorth,netWorthReal:final.realNetWorth,cash:final.cash,property:final.property,debt:final.debt,deposit:final.deposit,terminalEconomicCost:baseCashFuture-final.netWorth,equivalentMonthlyCost:(baseCashFuture-final.netWorth)/equivalentFactor,peakShortfall:Math.max(...months.map(x=>x.shortfall)),nominalCashOutflow:-ledger.filter(e=>!["income","investment-return","funding-interest"].includes(e.category)).reduce((a,e)=>a+e.amount,0)},warnings};
}

function compare(config) {
  validate(config);
  const kinds=Array.isArray(config.strategies)&&config.strategies.length?config.strategies:["rent","cash","mortgage"];
  const out=kinds.map(kind=>project(config,kind)).sort((a,b)=>b.summary.netWorthReal-a.summary.netWorthReal);
  return {engineVersion:"0.1.0",schemaVersion:"1.0",parameters:config,horizonMonths:config.months,baselineFuture:baseline(config),results:out,leader:out[0]?.kind,alerts:[]};
}

export {num, rateMonthly, payment, validate, baseline, project, compare, progressiveCapitalGainsTax, rentalEarlyExitPenalty};
