import {compare} from "./model-api.mjs";
import {sweep,breakEven,firstWinningMonth} from "./analysis.mjs";
import {migrateScenario,serializeScenario} from "./scenario.mjs";

const defaults = {
  "schemaVersion":"1.0","months":60,"initialCash":750000,"monthlyContribution":8000,
  "minimumReserve":25000,"inflationAnnual":.045,"investmentAnnualNet":.09,"negativeCashAnnualRate":.18,
  "property":{"price":600000,"marketValue":600000,"acquisitionRate":.03,"acquisitionFixed":12000,"initialRenovation":10000,"initialRenovationValueRate":.4,"condoMonthly":1100,"iptuMonthly":300,"insuranceMonthly":80,"maintenanceMonthly":250,"annualExtraCosts":1000,"initialMaintenanceReserve":0,"maintenanceReserveMonthly":0,"reserveAnnualReturn":0,"appreciationRealAnnual":.01,"neighborhoodRealAnnual":0,"propertyRealAnnual":-.005},
  "rent":{"monthly":3500,"annualIncrease":.045,"condoMonthly":1100,"iptuMonthly":300,"deposit":10500,"upfrontCosts":1800,"prepaid":false,"penaltyMode":"manual","contractMonths":30,"contractPenaltyMonths":3,"depositAnnualReturn":0},
  "mortgage":{"downPayment":180000,"months":360,"system":"sac","annualInterestRate":.115,"annualIndexRate":0,"insuranceMonthly":160,"fees":4000},
  "seller":{"downPayment":180000,"months":96,"annualInterestRate":.11,"annualCorrectionRate":.045,"fees":6000},
  "consortium":{"credit":510000,"shareAcquisitionPrice":80000,"remainingDebt":410000,"months":120,"annualIndexRate":.045,"monthlyOtherCharges":250,"transferFee":3000},
  "sale":{"sellAtEnd":true,"discountRate":.03,"commissionRate":.05,"fixedCosts":2500,"capitalGainsTaxRate":0,"taxPolicy":"manual","onlyProperty":false,"noSalePast5Years":false},
  "strategies":["rent","cash","mortgage","seller","consortium"],
  "metadata":{"currency":"BRL","referenceDate":"2026-11-23","source":"preset ilustrativo não cotação","confidence":"low"}
};
const names={rent:"Alugar",cash:"Comprar à vista",mortgage:"Financiar",seller:"Parcelar diretamente",consortium:"Carta contemplada"};
const colors={rent:"#3e8ea9",cash:"#267d63",mortgage:"#c19141",seller:"#a784bb",consortium:"#d0746d"};
const form=[
["1. Panorama financeiro",[
["months","Duração da análise","meses",1,600],["initialCash","Patrimônio financeiro inicial","R$"],["monthlyContribution","Aporte externo mensal comum","R$"],["minimumReserve","Reserva mínima de liquidez","R$"],["investmentAnnualNet","Rendimento financeiro líquido","% a.a."],["negativeCashAnnualRate","Custo anual de déficit de caixa","% a.a."],["inflationAnnual","Inflação anual (IPCA projetado)","% a.a."]]],
["2. Imóvel e aquisição",[
["property.price","Preço negociado","R$"],["property.marketValue","Avaliação atual de mercado","R$"],["property.acquisitionRate","ITBI e taxas proporcionais","%"],["property.acquisitionFixed","Cartório, avaliação e documentação","R$"],["property.initialRenovation","Reforma de entrada","R$"],["property.initialRenovationValueRate","Valorização imediata atribuída à reforma","%"],["property.initialFurnishing","Mobília e equipamentos iniciais","R$"]]],
["3. Custos do proprietário",[
["property.condoMonthly","Condomínio mensal","R$/mês"],["property.iptuMonthly","IPTU mensal equivalente","R$/mês"],["property.insuranceMonthly","Seguro residencial","R$/mês"],["property.maintenanceMonthly","Manutenção recorrente","R$/mês"],["property.annualExtraCosts","Custos extras anuais","R$/ano"],["property.initialMaintenanceReserve","Reserva inicial de manutenção","R$"],["property.maintenanceReserveMonthly","Aporte mensal à reserva","R$/mês"],["property.reserveAnnualReturn","Rendimento da reserva","% a.a."]]],
["4. Evolução do mercado imobiliário",[
["property.appreciationRealAnnual","Valorização real do mercado","% a.a."],["property.neighborhoodRealAnnual","Prêmio real do bairro","% a.a."],["property.propertyRealAnnual","Desgaste ou prêmio do imóvel","% a.a."]]],
["5. Aluguel equivalente",[
["rent.monthly","Aluguel atual","R$/mês"],["rent.annualIncrease","Reajuste contratual anual","% a.a."],["rent.condoMonthly","Condomínio pago por inquilino","R$/mês"],["rent.iptuMonthly","IPTU pago por inquilino","R$/mês"],["rent.insuranceMonthly","Seguro pago por inquilino","R$/mês"],["rent.maintenanceMonthly","Reparos do inquilino","R$/mês"],["rent.deposit","Caução recuperável","R$"],["rent.upfrontCosts","Despesas iniciais de locação","R$"],["rent.exitCosts","Saída e vistoria","R$"],["rent.earlyExitPenalty","Multa manual de saída","R$"],["rent.penaltyMode","Modo de multa","manual/proporcional"],["rent.contractMonths","Prazo contratual","meses",1,600],["rent.contractPenaltyMonths","Multa integral de referência","meses",0,24],["rent.depositAnnualReturn","Rendimento da caução","% a.a."],["rent.prepaid","Aluguel antecipado","sim/não"]]],
["6. Financiamento bancário",[
["mortgage.downPayment","Entrada","R$"],["mortgage.months","Prazo","meses",1,600],["mortgage.system","Sistema de amortização","SAC/Price"],["mortgage.annualInterestRate","Juros anuais efetivos","% a.a."],["mortgage.annualIndexRate","Taxa anual de correção do saldo","% a.a."],["mortgage.indexationFrequency","Periodicidade da correção","mensal/anual"],["mortgage.insuranceMonthly","Seguros mensais informados","R$/mês"],["mortgage.fees","Despesas iniciais bancárias","R$"]]],
["7. Parcelamento direto",[
["seller.downPayment","Sinal/entrada","R$"],["seller.months","Número de parcelas","meses",1,600],["seller.annualInterestRate","Juros anuais efetivos","% a.a."],["seller.annualCorrectionRate","Correção anual do saldo","% a.a."],["seller.indexationFrequency","Periodicidade da correção","mensal/anual"],["seller.fees","Taxas de contrato","R$"]]],
["8. Carta contemplada",[
["consortium.credit","Crédito liberado para aquisição","R$"],["consortium.shareAcquisitionPrice","Preço de aquisição da cota","R$"],["consortium.remainingDebt","Saldo contratual restante","R$"],["consortium.months","Prazo residual","meses",1,600],["consortium.annualIndexRate","Correção anual do saldo","% a.a."],["consortium.monthlyOtherCharges","Encargos extras mensais","R$/mês"],["consortium.transferFee","Custos de cessão/transferência","R$"]]],
["9. Venda ou manutenção do imóvel",[
["sale.sellAtEnd","Vender no fim do horizonte","sim/não"],["sale.discountRate","Desconto na negociação","%"],["sale.commissionRate","Comissão de corretagem","%"],["sale.fixedCosts","Outras despesas da venda","R$"],["sale.capitalGainsTaxRate","Alíquota efetiva hipotética do ganho","%"],["sale.taxPolicy","Regra de tributação","manual/progressivo"],["sale.onlyProperty","Declara ser seu único imóvel","sim/não"],["sale.noSalePast5Years","Declara não ter vendido imóvel em cinco anos","sim/não"],["sale.taxBasisOverride","Base fiscal documentada (opcional, substitui a automática)","R$"],["sale.additionalTaxBasis","Custos fiscais adicionais documentados","R$"]]]
],
["10. Equivalência entre imóveis",[
["housingEquivalence.buy.areaSqm","Área do imóvel comprado","m²"],["housingEquivalence.rent.areaSqm","Área do imóvel alugado","m²"],
["housingEquivalence.buy.bedrooms","Quartos na compra","quartos"],["housingEquivalence.rent.bedrooms","Quartos no aluguel","quartos"],
["housingEquivalence.buy.neighborhood","Bairro do imóvel comprado","texto"],["housingEquivalence.rent.neighborhood","Bairro do imóvel alugado","texto"]]]
];
let data,report,storageBlocked=false,invalidBackup=null;
const $=sel=>document.querySelector(sel);
const brl=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(v);
const compact=v=>new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1}).format(v);
const deep=o=>JSON.parse(JSON.stringify(o));
function at(path){return path.split(".").reduce((v,k)=>v?.[k],data);}
function put(path,value){const parts=path.split(".");let dest=data;for(const key of parts.slice(0,-1)){dest[key]??={};dest=dest[key]}dest[parts.at(-1)]=value;}
function toast(message){const t=$("#toast");t.textContent=message;t.classList.add("visible");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("visible"),3500);}
function safeStore(){if(storageBlocked)return;try{localStorage.setItem("comprar-alugar-v1",serializeScenario(data))}catch{}}
function buildForm(){
  $("#strategies").replaceChildren();
  for(const [key,name] of Object.entries(names)){
    const label=document.createElement("label");label.className="strategy-option";
    const inp=document.createElement("input");inp.type="checkbox";inp.checked=data.strategies.includes(key);
    inp.addEventListener("change",()=>{data.strategies=Object.keys(names).filter(k=>[...$("#strategies").querySelectorAll("input")].find(i=>i.dataset.key===k)?.checked);run()});
    inp.dataset.key=key;label.append(inp,document.createTextNode(name));$("#strategies").append(label);
  }
  const container=$("#form-groups");container.replaceChildren();
  for(const [i,group] of form.entries()){
    const details=document.createElement("details");details.open=i<2;
    const summary=document.createElement("summary");summary.textContent=group[0];details.append(summary);
    const list=document.createElement("div");list.className="fields";
    for(const [path,label,unit,min,max] of group[1]){
      const field=document.createElement("div");field.className="field";
      const l=document.createElement("label");l.textContent=label;l.htmlFor="f-"+path.replaceAll(".","-");
      const input=document.createElement("input");input.id=l.htmlFor;input.dataset.path=path;
      const val=at(path);let select;
      if(unit==="mensal/anual"){
        select=document.createElement("select");select.id=input.id;select.dataset.path=path;
        for(const [v,name] of [["annual","Anual no aniversário"],["monthly","Mensal (taxa anual convertida)"]]){const o=document.createElement("option");o.value=v;o.textContent=name;select.append(o)}
        select.value=val||"annual";
      }else if(unit==="manual/proporcional"||unit==="manual/progressivo"){
        select=document.createElement("select");select.id=input.id;select.dataset.path=path;
        const choices=unit==="manual/proporcional"?[["manual","Manual"],["proportional","Proporcional"]]:[["manual","Manual"],["progressive","Progressivo (Brasil)"]];
        for(const [v,name] of choices){const o=document.createElement("option");o.value=v;o.textContent=name;select.append(o)}
        select.value=val||"manual";
      }else if(unit==="SAC/Price"){
        select=document.createElement("select");select.id=input.id;select.dataset.path=path;
        for(const opt of ["sac","price"]){const o=document.createElement("option");o.value=opt;o.textContent=opt.toUpperCase();select.append(o)}select.value=val||"sac";
      }else if(unit==="sim/não"){input.type="checkbox";input.checked=!!val;}
      else if(unit==="texto"){input.type="text";input.value=String(val??"");}
      else{input.type="number";input.step="any";if(min!==undefined)input.min=String(min);if(max!==undefined)input.max=String(max);input.value=String(unit.startsWith("%")?(Number(val||0)*100):Number(val||0));}
      const control=select||input;
      control.addEventListener("change",()=>{
        let value=unit==="sim/não"?input.checked:select?select.value:unit==="texto"?input.value:Number(input.value);
        if(unit.startsWith("%"))value/=100;
        if(typeof value==="number"&&!Number.isFinite(value)){toast("Número inválido");return}
        put(path,value);storageBlocked=false;run();
      });
      const hint=document.createElement("span");hint.className="unit";hint.textContent=unit==="sim/não"?"Aplicável à estratégia":unit.startsWith("%")?"Informar como porcentagem":"Unidade: "+unit;
      field.append(l,control,hint);list.append(field);
    }
    details.append(list);container.append(details);
  }
}
function svgNode(tag,attrs,text){const node=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));if(text!==undefined)node.textContent=text;return node;}
function chart(results){
  const svg=$("#wealth-chart");svg.replaceChildren();
  const series=results.map(x=>x.months.map(m=>$("#chart-view").value==="real"?m.realNetWorth:m.netWorth));
  const all=series.flat(),hi=Math.max(...all),lo=Math.min(...all),pad=Math.max(1,(hi-lo)*.10),max=hi+pad,min=lo-pad;
  const left=73,right=815,top=18,bottom=230;
  for(let i=0;i<=4;i++){
    const y=top+(bottom-top)*i/4,value=max-(max-min)*i/4;
    svg.append(svgNode("line",{x1:left,y1:y,x2:right,y2:y,stroke:"#e6edef","stroke-width":1}));
    svg.append(svgNode("text",{x:left-12,y:y+4,"text-anchor":"end",fill:"#8c9ca6","font-size":11},compact(value)));
  }
  const N=data.months;
  for(let i=0;i<=5;i++){const x=left+(right-left)*i/5;svg.append(svgNode("text",{x,y:252,"text-anchor":"middle",fill:"#8c9ca6","font-size":11},String(Math.round(N*i/60))+" anos"));}
  for(let idx=0;idx<series.length;idx++){
    const vals=series[idx];const points=vals.map((v,j)=>(left+(right-left)*j/N).toFixed(2)+","+(bottom-(v-min)/(max-min)*(bottom-top)).toFixed(2)).join(" ");
    svg.append(svgNode("polyline",{points,stroke:colors[results[idx].kind],fill:"none","stroke-width":2.9,"stroke-linecap":"round","stroke-linejoin":"round"}));
  }
  const legend=$("#legend");legend.replaceChildren();
  results.forEach(result=>{const span=document.createElement("span"),swatch=document.createElement("i");swatch.className="swatch";swatch.style.background=colors[result.kind];span.append(swatch,document.createTextNode(names[result.kind]));legend.append(span);});
}
function render(){
  const results=report.results,first=results[0],second=results[1];
  $("#winner").textContent=names[first.kind];$("#winner-detail").textContent=brl(first.summary.netWorthReal)+" de patrimônio líquido real";
  $("#advantage").textContent=second?brl(first.summary.netWorthReal-second.summary.netWorthReal):"—";
  $("#horizon").textContent=String(data.months/12).replace(".",",")+" anos";
  $("#baseline").textContent=brl(report.baselineFuture);
  const tbody=$("#comparison-body");tbody.replaceChildren();
  for(const [i,x] of results.entries()){
    const tr=document.createElement("tr");if(i===0)tr.className="best";
    const vals=[names[x.kind],brl(x.summary.netWorthReal),i===0?"Líder":"− "+brl(first.summary.netWorthReal-x.summary.netWorthReal),brl(x.summary.equivalentMonthlyCost),brl(x.summary.cash),brl(x.summary.peakShortfall)];
    vals.forEach((val,index)=>{const td=document.createElement("td");if(index===0||index===1){const strong=document.createElement("strong");strong.textContent=val;td.append(strong)}else td.textContent=val;tr.append(td)});
    const td=document.createElement("td"),btn=document.createElement("button");btn.className="small-link";btn.textContent="Fluxos";btn.type="button";btn.addEventListener("click",()=>{$("#detail-strategy").value=x.kind;details();$("#detail-strategy").scrollIntoView({behavior:"smooth",block:"center"})});td.append(btn);tr.append(td);tbody.append(tr);
  }
  const sel=$("#detail-strategy"),old=sel.value;sel.replaceChildren();
  for(const x of results){const opt=document.createElement("option");opt.value=x.kind;opt.textContent=names[x.kind];sel.append(opt)}
  if(results.some(x=>x.kind===old))sel.value=old;
  details();chart(results);renderSensitivity();
  const warn=$("#warnings");warn.replaceChildren();
  const notices=[
    ...report.alerts,
    "Os rendimentos, impostos, reajustes e valores de revenda são hipóteses do usuário — não projeções oficiais.",
    "O índice do saldo bancário é aplicado segundo a frequência informada, com prestação recalculada sobre o prazo restante; confira a proposta e o CET.",
    "Se o imóvel é mantido no fim, seu valor de mercado é patrimônio ilíquido, não dinheiro disponível para saque.",
    "Aluguéis, imóveis e padrão de moradia devem ser equivalentes; o sistema ainda não pontua a diferença de qualidade."
  ];
  for(const x of results)for(const w of x.warnings)if(!notices.includes(w))notices.push(w);
  notices.forEach(msg=>{const li=document.createElement("li");li.textContent=msg;warn.append(li)});
}
function details(){
  const chosen=report?.results.find(x=>x.kind===$("#detail-strategy").value);
  const body=$("#monthly-body");body.replaceChildren();if(!chosen)return;
  for(const m of chosen.months){const tr=document.createElement("tr");[m.month,brl(m.cash),brl(m.property),brl(m.debt),brl(m.netWorth)].forEach(t=>{const td=document.createElement("td");td.textContent=t;tr.append(td)});body.append(tr)}
}
function run(){
  try{
    if(!data.strategies.length)throw new Error("Selecione ao menos uma estratégia.");
    data=migrateScenario(data);report=compare(data);render();safeStore();
    $("#warnings-panel").classList.remove("error");
  }catch(error){$("#warnings-panel").classList.add("error");toast(error.message);$("#winner").textContent="Corrigir premissas";$("#comparison-body").replaceChildren();}
}

function renderSensitivity(){
  const host=$("#sensitivity-results");if(!host||!report)return;
  host.replaceChildren();
  const selections=[["Aluguel inicial","rent.monthly",[.8,1,1.2],brl],["Valorização real do mercado","property.appreciationRealAnnual",[-.02,0,.02],v=>(v*100).toFixed(1)+"% a.a."],["Retorno financeiro","investmentAnnualNet",[-.02,0,.02],v=>(v*100).toFixed(1)+"% a.a."]];
  for(const [title,path,factors,fmt] of selections){
    const base=path.split(".").reduce((v,key)=>v?.[key],data);
    const values=factors.map(x=>path==="rent.monthly"?base*x:base+x);
    const r=sweep(data,path,values,"cash","rent");
    const card=document.createElement("div");card.className="scenario-card";
    const label=document.createElement("h3");label.textContent=title;card.append(label);
    for(let i=0;i<3;i++){
      const item=document.createElement("div");item.className="sensitivity-line";
      const a=document.createElement("span");a.textContent=fmt(values[i]);
      const b=document.createElement("strong");b.textContent=(r[i].difference>=0?"+":"−")+" "+brl(Math.abs(r[i].difference));
      item.append(a,b);card.append(item);
    }
    const foot=document.createElement("small");foot.textContent="Vantagem de comprar à vista sobre alugar (patrimônio real)";card.append(foot);
    host.append(card);
  }
  const eq=breakEven(data,"rent.monthly","cash","rent",0,Math.max(data.rent.monthly*5,1000));
  $("#rent-break-even").textContent=eq.value===null?"Sem empate na faixa pesquisada":brl(eq.value)+"/mês";
  // O equilíbrio pode mudar de sinal mais de uma vez ao longo do tempo: exibir apenas um primeiro cruzamento.
  const horizon=firstWinningMonth(data,"cash","rent",Math.min(240,Math.max(data.months,24)));
  $("#first-win").textContent=horizon.firstMonth===null?"Não encontrado":horizon.firstMonth+" meses";
}

function download(filename,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("#export").addEventListener("click",()=>{try{download("comprar-alugar.json",serializeScenario(data),"application/json")}catch(error){toast(error.message)}});
$("#backup-storage").addEventListener("click",()=>{if(invalidBackup)download("comprar-alugar-backup-nao-validado.json",invalidBackup,"application/json")});
$("#reset").addEventListener("click",()=>{storageBlocked=false;data=deep(defaults);buildForm();run();$("#storage-alert").hidden=true;toast("Cenário de exemplo restaurado")});
$("#upload").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{const imported=migrateScenario(JSON.parse(await file.text()));compare(imported);data=imported;storageBlocked=false;buildForm();run();$("#storage-alert").hidden=true;toast("JSON validado e importado")}catch(error){toast("Falha na importação: "+error.message)}e.target.value=""});
$("#export-ledger").addEventListener("click",()=>{const x=report?.results.find(x=>x.kind===$("#detail-strategy").value);if(!x)return;const rows=[["mes","categoria","valor","descricao"],...x.ledger.map(e=>[e.month,e.category,e.amount,e.description])];const csv=rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(";")).join("\n");download("comprar-alugar-"+x.kind+"-ledger.csv","\ufeff"+csv,"text/csv;charset=utf-8");});
$("#detail-strategy").addEventListener("change",details);
$("#chart-view").addEventListener("change",()=>{if(report)chart(report.results)});
try{
  const stored=localStorage.getItem("comprar-alugar-v1");
  data=migrateScenario(stored?JSON.parse(stored):deep(defaults));
}catch(error){
  try{invalidBackup=localStorage.getItem("comprar-alugar-v1")}catch{}
  storageBlocked=true;
  data=deep(defaults);
  $("#storage-alert").hidden=false;
  $("#storage-alert-text").textContent="Cenário salvo não pôde ser carregado: "+error.message+". O original foi preservado; faça um backup antes de restaurar ou editar.";
  $("#backup-storage").hidden=!invalidBackup;
}
buildForm();run();
