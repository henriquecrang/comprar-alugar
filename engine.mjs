import {assessComparability} from "./comparability.mjs";
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
  if(config.schemaVersion!==undefined&&config.schemaVersion!=="1.0")throw new Error("Versão de JSON incompatível: "+String(config.schemaVersion));
  if(!Number.isInteger(months)||months<1||months>600) throw new Error("Horizonte deve ter de 1 a 600 meses");
  if(cash<0) throw new Error("Capital inicial não pode ser negativo");
  const p=config.property||{},r=config.rent||{},s=config.sale||{};
  if(num(p,"price",0)<=0) throw new Error("Preço do imóvel deve ser positivo");
  if(num(r,"monthly",0)<0) throw new Error("Aluguel não pode ser negativo");
  for(const [subject,fields] of [[p,["marketValue","acquisitionFixed","initialRenovation","initialFurnishing","condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly","annualExtraCosts","initialMaintenanceReserve","maintenanceReserveMonthly"]],[r,["deposit","upfrontCosts","exitCosts","earlyExitPenalty","condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly"]],[s,["fixedCosts","additionalTaxBasis"]]]){
    for(const field of fields)if(num(subject,field,0)<0)throw new Error("Valor negativo não permitido: "+field);
  }
  for(const [subject,fields] of [[p,["acquisitionRate","initialRenovationValueRate"]],[s,["discountRate","commissionRate","capitalGainsTaxRate"]]]){
    for(const field of fields){const v=num(subject,field,0);if(v<0||v>1)throw new Error("Percentual fora de 0 a 100%: "+field);}
  }
  rateMonthly(num(r,"annualIncrease",0));
  if(num(r,"deposit",0)<0)throw new Error("Caução não pode ser negativa");
  if(num(p,"initialMaintenanceReserve",0)<0||num(p,"maintenanceReserveMonthly",0)<0)throw new Error("Reserva de manutenção inválida");
  rateMonthly(num(r,"depositAnnualReturn",0));
  if(num(s,"discountRate",0)<0||num(s,"commissionRate",0)<0||num(s,"discountRate",0)+num(s,"commissionRate",0)>=1) throw new Error("Taxas de venda inválidas");
  ["investmentAnnualNet","inflationAnnual","negativeCashAnnualRate"].forEach(k=>rateMonthly(num(config,k,k==="negativeCashAnnualRate"?0.18:0)));
  if(config.monthlyRates)for(const key of ["investment","inflation","negativeCash","propertyExtra"]){
    const series=config.monthlyRates[key];
    if(series!==undefined&&(!Array.isArray(series)||series.length!==months||series.some(v=>!Number.isFinite(v)||v<=-1)))throw new Error("Série mensal inválida: "+key);
  }
  ["appreciationRealAnnual","neighborhoodRealAnnual","propertyRealAnnual"].forEach(k=>rateMonthly(num(p,k,0)));
  if(config.mortgage) {
    const x=config.mortgage;
    if(!["price","sac"].includes(x.system||"price"))throw new Error("Sistema de financiamento desconhecido");
    if(num(x,"downPayment",0)<0||num(x,"downPayment",0)>num(p,"price"))throw new Error("Entrada inválida");
    if(!Number.isInteger(num(x,"months",360))||num(x,"months",360)<1)throw new Error("Prazo inválido");
    for(const key of ["annualInterestRate","annualIndexRate"])rateMonthly(num(x,key,0));
    if(num(x,"insuranceMonthly",0)<0||num(x,"fees",0)<0)throw new Error("Encargos financeiros negativos");
  }
  if(config.seller){
    const x=config.seller;
    if(num(x,"downPayment",0)<0||num(x,"downPayment",0)>num(p,"price"))throw new Error("Entrada inválida");
    if(!Number.isInteger(num(x,"months",60))||num(x,"months",60)<1)throw new Error("Prazo inválido: seller.months");
    for(const key of ["annualInterestRate","annualCorrectionRate","annualIndexRate"])rateMonthly(num(x,key,0));
    if(num(x,"fees",0)<0)throw new Error("Taxas de contrato negativas");
  }
  if(config.consortium){
    const x=config.consortium;
    if(num(x,"credit",0)<0||num(x,"remainingDebt",0)<0||num(x,"credit",0)>num(p,"price"))throw new Error("Crédito de consórcio inválido");
    if(!Number.isInteger(num(x,"months",1))||num(x,"months",1)<1)throw new Error("Prazo de consórcio inválido");
    for(const k of ["shareAcquisitionPrice","transferFee","monthlyOtherCharges"])if(num(x,k,0)<0)throw new Error("Encargos consórcio negativos");
    rateMonthly(num(x,"annualIndexRate",0));
  }
  for(const l of [config.mortgage,config.seller].filter(Boolean)){
    if(l.indexationFrequency!==undefined&&!["annual","monthly"].includes(l.indexationFrequency))throw new Error("Frequência de indexação inválida");
    if(l.monthlyIndexRates!==undefined&&(!Array.isArray(l.monthlyIndexRates)||l.monthlyIndexRates.length!==months||l.monthlyIndexRates.some(x=>!Number.isFinite(x)||x<=-1)))throw new Error("Série mensal de índice inválida");
    if(l.monthlyIndexRates!==undefined&&l.indexationFrequency==="annual")throw new Error("Não misturar índice mensal e anual no mesmo financiamento");
    if(l.extraPayments!==undefined&&(!Array.isArray(l.extraPayments)||l.extraPayments.some(x=>!Number.isInteger(x.month)||x.month<1||x.month>months||!Number.isFinite(x.amount)||x.amount<0)))throw new Error("Amortizações extraordinárias inválidas");
  }
  if(config.strategies!==undefined&&(!Array.isArray(config.strategies)||config.strategies.length<1||new Set(config.strategies).size!==config.strategies.length||config.strategies.some(x=>!["rent","cash","mortgage","seller","consortium"].includes(x))))throw new Error("Lista de estratégias inválida");
  const overrides=config.strategyOverrides;
  if(overrides!==undefined){
    if(!overrides||typeof overrides!=="object"||Array.isArray(overrides))throw new Error("Overrides por estratégia inválidos");
    const allowed={
      property:["marketValue","condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly","annualExtraCosts","appreciationRealAnnual","neighborhoodRealAnnual","propertyRealAnnual","initialMaintenanceReserve","maintenanceReserveMonthly","reserveAnnualReturn"],
      rent:["monthly","annualIncrease","condoMonthly","iptuMonthly","insuranceMonthly","maintenanceMonthly","deposit","upfrontCosts","earlyExitPenalty","exitCosts","depositAnnualReturn"],
      mortgage:["insuranceMonthly","fees","annualInterestRate","annualIndexRate"],
      seller:["annualInterestRate","annualCorrectionRate","fees"],
      consortium:["monthlyOtherCharges","annualIndexRate","transferFee"],
      sale:["discountRate","commissionRate","fixedCosts","capitalGainsTaxRate"]
    };
    for(const [kind,sections] of Object.entries(overrides)){
      if(!["rent","cash","mortgage","seller","consortium"].includes(kind)||!sections||typeof sections!=="object"||Array.isArray(sections))throw new Error("Override de modalidade inválido: "+kind);
      for(const [section,fields] of Object.entries(sections)){
        if(!allowed[section]||!fields||typeof fields!=="object"||Array.isArray(fields))throw new Error("Seção de override inválida: "+section);
        if(section!=="property"&&section!=="sale"&&section!==(kind==="cash"?"":kind))throw new Error("Override não se aplica à modalidade "+kind+": "+section);
        for(const [name,val] of Object.entries(fields)){
          if(!allowed[section].includes(name)||typeof val!=="number"||!Number.isFinite(val)||(["annualInterestRate","annualCorrectionRate","annualIndexRate","appreciationRealAnnual","neighborhoodRealAnnual","propertyRealAnnual","reserveAnnualReturn","annualIncrease","depositAnnualReturn"].includes(name)?val<=-1:val<0))throw new Error("Override fora dos limites: "+kind+"."+section+"."+name);
          if(["discountRate","commissionRate","capitalGainsTaxRate"].includes(name)&&val>1)throw new Error("Taxa de override maior que 100%");
        }
      }
    }
  }
  const eqv=config.housingEquivalence;
  if(eqv!==undefined){
    if(!eqv||typeof eqv!=="object"||Array.isArray(eqv))throw new Error("Equivalência habitacional inválida");
    for(const mode of ["buy","rent"])if(eqv[mode]!==undefined){
      const h=eqv[mode];
      if(!h||typeof h!=="object"||Array.isArray(h))throw new Error("Habitação inválida: "+mode);
      for(const key of ["areaSqm","bedrooms"])if(h[key]!==undefined&&(!Number.isFinite(h[key])||h[key]<0||(key==="bedrooms"&&!Number.isInteger(h[key]))))throw new Error("Parâmetro de equivalência inválido: "+key);
      for(const key of ["neighborhood","housingType"])if(h[key]!==undefined&&typeof h[key]!=="string")throw new Error("Descrição de equivalência inválida");
    }
  }
  return true;
}

function baseline(config) {
  let v=num(config,"initialCash");
  for(let m=1;m<=num(config,"months",60);m++){
    const annual=v>=0?num(config,"investmentAnnualNet",0):num(config,"negativeCashAnnualRate",0.18);
    const key=v>=0?"investment":"negativeCash";
    v=v*(1+monthlyRateAt(config,key,annual,m))+num(config,"monthlyContribution",0);
  }
  return v;
}

function monthlyRateAt(config,key,annual,m) {
  const series=config.monthlyRates && config.monthlyRates[key];
  if(!series)return rateMonthly(annual);
  if(!Array.isArray(series)||series.length<num(config,"months"))throw new Error("Série mensal incompleta: "+key);
  const rate=series[m-1];
  if(!Number.isFinite(rate)||rate<=-1)throw new Error("Taxa mensal inválida: "+key);
  return rate;
}
function monthlyAnnuityFactor(config) {
  let f=0;
  for(let m=1;m<=num(config,"months");m++)f=f*(1+monthlyRateAt(config,"investment",num(config,"investmentAnnualNet",0),m))+1;
  return f;
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
function debtIndexRate(contract,m,annualDefault=0) {
  if(contract.monthlyIndexRates!==undefined)return contract.monthlyIndexRates[m-1];
  const annual=num(contract,"annualIndexRate",annualDefault);
  return contract.indexationFrequency==="monthly"?rateMonthly(annual):
    m>1&&(m-1)%12===0?annual:0;
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
  const N=num(config,"months",60),price=num(config.property,"price");
  const override=config.strategyOverrides?.[kind]||{};
  const p={...(config.property||{}),...(override.property||{})};
  const r={...(config.rent||{}),...(override.rent||{})};
  const loan={...(config.mortgage||{}),...(override.mortgage||{})};
  const seller={...(config.seller||{}),...(override.seller||{})};
  const cons={...(config.consortium||{}),...(override.consortium||{})};
  const sale={...(config.sale||{}),...(override.sale||{})};
  const annualGrowth=(1+num(config,"inflationAnnual"))*(1+num(p,"appreciationRealAnnual"))*(1+num(p,"neighborhoodRealAnnual"))*(1+num(p,"propertyRealAnnual"))-1;
  const growth=rateMonthly(annualGrowth), interest=rateMonthly(num(config,"investmentAnnualNet")), overdraft=rateMonthly(num(config,"negativeCashAnnualRate",0.18));
  const inflation=rateMonthly(num(config,"inflationAnnual"));
  const isOwner=kind!=="rent",cashStart=num(config,"initialCash"),inflow=num(config,"monthlyContribution");
  let cumulativeInflation=1;
  const state={cash:cashStart,property:0,debt:0,deposit:0,reserve:0,marketBasis:0,taxBasis:0,loanMonth:0,principal:0,rate:0,originalMonths:0,originalPayment:0,system:"price"};
  const ledger=[],months=[],warnings=[],renovations=Array.isArray(p.renovations)?p.renovations:[];
  const note=(m,type,amount,description)=>{
    if(!Number.isFinite(amount))throw new Error("Lançamento inválido: "+type);
    if(Math.abs(amount)<0.0000001)return;
    state.cash+=amount;
    ledger.push({id:kind+":"+m+":"+ledger.length,month:m,category:type,amount,description:description||type,source:"model",cashChange:amount});
  };
  const costEntry=num(p,"acquisitionFixed",0)+price*num(p,"acquisitionRate",0)+num(p,"initialRenovation",0)+num(p,"initialFurnishing",0);
  const taxFee=num(p,"acquisitionFixed",0)+price*num(p,"acquisitionRate",0);
  for(let m=0;m<=N;m++){
    if(m>0){
      cumulativeInflation*=1+monthlyRateAt(config,"inflation",num(config,"inflationAnnual",0),m);
      if(kind==="rent" && state.deposit>0)state.deposit*=1+rateMonthly(num(r,"depositAnnualReturn",0));
      if(isOwner && state.reserve>0)state.reserve*=1+rateMonthly(num(p,"reserveAnnualReturn",0));
      const cashRate=state.cash>=0?
        monthlyRateAt(config,"investment",num(config,"investmentAnnualNet",0),m):
        monthlyRateAt(config,"negativeCash",num(config,"negativeCashAnnualRate",0.18),m);
      note(m,state.cash>=0?"investment-return":"funding-interest",state.cash*cashRate,"Rendimento líquido ou custo de cobertura do caixa");
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
    if(m===0 && isOwner && num(p,"initialMaintenanceReserve",0)>0){
      const transfer=num(p,"initialMaintenanceReserve",0);
      state.reserve+=transfer;
      note(m,"reserve-transfer",-transfer,"Transferência para reserva vinculada de manutenção");
    }
    if(m===0 && kind==="rent"){
      const deposit=num(r,"deposit"),fees=num(r,"upfrontCosts");
      state.deposit=deposit;
      note(m,"deposit",-deposit,"Caução recuperável (capital vinculado)");
      note(m,"rent-entry",-fees,"Custos iniciais de locação");
    }
    if(m>0 && isOwner){
      const infRate=monthlyRateAt(config,"inflation",num(config,"inflationAnnual",0),m);
      const realMarket=rateMonthly(num(p,"appreciationRealAnnual",0));
      const realNeighborhood=rateMonthly(num(p,"neighborhoodRealAnnual",0));
      const realSpecific=rateMonthly(num(p,"propertyRealAnnual",0));
      const extra=monthlyRateAt(config,"propertyExtra",0,m);
      state.property*=(1+infRate)*(1+realMarket)*(1+realNeighborhood)*(1+realSpecific)*(1+extra);
      if(kind==="mortgage"||kind==="seller"){
        const l=kind==="mortgage"?loan:seller;
        if(state.debt>0){
          const rate=debtIndexRate(l,m,kind==="seller"?num(l,"annualCorrectionRate",0):0);
          if(rate!==0){
            const adjustment=state.debt*rate;
            state.debt+=adjustment;
            ledger.push({id:kind+":"+m+":"+ledger.length,month:m,category:"debt-indexation",amount:0,cashChange:0,debtChange:adjustment,source:"contract-index",description:"Atualização não monetária do saldo devedor"});
          }
          // Recálculo mensal sobre saldo e prazo restantes: tanto Price quanto SAC liquidam na data contratual.
          const remaining=Math.max(1,state.originalMonths-m+1);
          const accrued=state.debt*state.rate;
          const scheduled=payment(state.debt,state.rate,remaining,state.system,1);
          const principalPaid=Math.max(0,Math.min(state.debt,scheduled-accrued));
          state.debt-=principalPaid;
          if(Math.abs(state.debt)<1e-7)state.debt=0;
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
      const recurringMaintenance=num(p,"maintenanceMonthly",0);
      note(m,"maintenance",-recurringMaintenance,"Manutenção recorrente");
      const reimbursement=Math.min(state.reserve,Math.max(0,recurringMaintenance));
      if(reimbursement>0){state.reserve-=reimbursement;note(m,"reserve-draw",reimbursement,"Uso de reserva para manutenção (transferência)");}
      const monthlyContribution=num(p,"maintenanceReserveMonthly",0);
      if(monthlyContribution>0){state.reserve+=monthlyContribution;note(m,"reserve-transfer",-monthlyContribution,"Aporte à reserva vinculada de manutenção");}
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
      const sold=grossPrice-grossPrice*num(sale,"commissionRate",0)-num(sale,"fixedCosts",0);
      const basis=sale.taxBasisOverride===undefined?state.taxBasis:num(sale,"taxBasisOverride");
      const gain=Math.max(0,sold-(basis+num(sale,"additionalTaxBasis",0)));
      const qualifiesOnlyHome=sale.onlyProperty===true && sale.noSalePast5Years===true && grossPrice<=440000;
      const gainTax=qualifiesOnlyHome?0:
        sale.taxPolicy==="progressive"?progressiveCapitalGainsTax(gain):
        num(sale,"capitalGainsTaxRate",0)*gain;
      note(m,"sale",sold,"Receita de venda líquida de corretagem e descontos");
      note(m,"capital-gains-tax",-gainTax,"Tributo hipotético parametrizado; verificar isenções");
      if(state.debt>0){note(m,"debt-payoff",-state.debt,"Quitação das obrigações na alienação");state.debt=0;}
      state.property=0;
      if(state.reserve>0){note(m,"reserve-release",state.reserve,"Liberação de reserva vinculada após a venda");state.reserve=0;}
      if(qualifiesOnlyHome)warnings.push("Isenção de único imóvel (até R$ 440 mil) simulada com declarações do usuário; validar condições legais.");
      else if(sale.taxPolicy!=="progressive"&&num(sale,"capitalGainsTaxRate",0)===0)warnings.push("IR de ganho de capital não parametrizado: valor zero não confirma isenção.");
      else if(sale.taxPolicy==="progressive")warnings.push("IR progressivo ilustrativo: fatores legais de redução, reinvestimento em 180 dias e demais isenções não estão automatizados.");
    }
    if(m===N && kind==="rent"){
      note(m,"deposit-return",state.deposit*(1+num(r,"depositReturnRate",0)),"Restituição da caução");
      state.deposit=0;
      note(m,"rent-exit",-num(r,"exitCosts",0)-rentalEarlyExitPenalty(r,N),"Custos e multa de saída informados");
    }
    months.push({month:m,cash:state.cash,property:state.property,debt:state.debt,deposit:state.deposit,reserve:state.reserve,netWorth:state.cash+state.property+state.deposit+state.reserve-state.debt,realNetWorth:(state.cash+state.property+state.deposit+state.reserve-state.debt)/cumulativeInflation,shortfall:Math.max(0,num(config,"minimumReserve",0)-state.cash)});
  }
  if(months.some(x=>x.shortfall>0))warnings.push("Caixa caiu abaixo da reserva mínima; verificar disponibilidade/financiamento de déficits.");
  if(kind==="consortium")warnings.push("Carta contemplada: conferir regulamento, encargos, liberação, transferência e garantias.");
  const baseCashFuture=baseline(config),final=months[months.length-1];
  const equivalentFactor=monthlyAnnuityFactor(config);
  return {kind,horizonMonths:N,ledger,months,summary:{netWorth:final.netWorth,netWorthReal:final.realNetWorth,cash:final.cash,property:final.property,debt:final.debt,deposit:final.deposit,reserve:final.reserve,terminalEconomicCost:baseCashFuture-final.netWorth,equivalentMonthlyCost:(baseCashFuture-final.netWorth)/equivalentFactor,peakShortfall:Math.max(...months.map(x=>x.shortfall)),nominalCashOutflow:-ledger.filter(e=>!["income","investment-return","funding-interest"].includes(e.category)).reduce((a,e)=>a+e.amount,0)},warnings};
}

function compare(config) {
  validate(config);
  const kinds=Array.isArray(config.strategies)&&config.strategies.length?config.strategies:["rent","cash","mortgage"];
  const out=kinds.map(kind=>project(config,kind)).sort((a,b)=>b.summary.netWorthReal-a.summary.netWorthReal);
  return {engineVersion:"0.2.0",schemaVersion:"1.0",parameters:config,horizonMonths:config.months,baselineFuture:baseline(config),results:out,leader:out[0]?.kind,alerts:assessComparability(config)};
}

export {num, rateMonthly, payment, validate, baseline, project, compare, progressiveCapitalGainsTax, rentalEarlyExitPenalty, monthlyRateAt, monthlyAnnuityFactor, debtIndexRate};
