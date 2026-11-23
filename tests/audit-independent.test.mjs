import test from "node:test";
import assert from "node:assert/strict";
import {compare,project,validate,rateMonthly} from "../engine.mjs";

const eq=(a,b,epsilon=1e-7)=>assert.ok(Math.abs(a-b)<=epsilon,"Esperado "+b+", recebido "+a);
function scenario({months=12,price=1200,cash=10000,monthly=0,rent=0}={}){
  return {schemaVersion:"1.0",months,initialCash:cash,monthlyContribution:monthly,
    investmentAnnualNet:0,inflationAnnual:0,property:{price,marketValue:price},
    rent:{monthly:rent},mortgage:{downPayment:0,months:12,system:"price",annualInterestRate:0},
    seller:{downPayment:0,months:12,annualInterestRate:0},consortium:{credit:price,remainingDebt:price,months:12},
    sale:{sellAtEnd:false},strategies:["rent","cash","mortgage","seller","consortium"]};
}
const entries=(s,category)=>s.ledger.filter(x=>x.category===category);
test("oráculo externo: imóvel sem valorização e locação de custo zero preservam capital",()=>{
  const c=scenario();
  for(const strategy of ["rent","cash","mortgage","seller","consortium"])eq(project(c,strategy).summary.netWorth,10000);
});
test("oráculo SAC: amortização uniforme e juros sobre saldo anterior",()=>{
  const c=scenario();c.mortgage.system="sac";c.mortgage.annualInterestRate=(1+.01)**12-1;
  const x=project(c,"mortgage");
  eq(entries(x,"loan-principal")[0].amount,-100);
  eq(entries(x,"loan-interest")[0].amount,-12);
  eq(entries(x,"loan-principal")[1].amount,-100);
  eq(entries(x,"loan-interest")[1].amount,-11);
  eq(x.months[11].debt,100);eq(x.months[12].debt,0);
  eq(entries(x,"loan-principal").reduce((a,e)=>a+e.amount,0),-1200);
});
test("oráculo Price: prestação constante por fórmula independente e dívida zerada",()=>{
  const c=scenario();c.mortgage.annualInterestRate=.12;
  const i=Math.pow(1.12,1/12)-1;
  const expectedPmt=1200*i/(1-Math.pow(1+i,-12));
  let balance=1200;
  for(let m=0;m<12;m++)balance=balance*(1+i)-expectedPmt;
  const x=project(c,"mortgage");
  eq(entries(x,"loan-principal")[0].amount,-(expectedPmt-1200*i));
  eq(entries(x,"loan-interest")[0].amount,-1200*i);
  eq(x.months[12].debt,0);
  eq(balance,0,1e-8);
});
test("oráculo Price indexado: saldo corrigido no mês 13; quitação no 24",()=>{
  const c=scenario({months:24,price:2400});c.mortgage={downPayment:0,months:24,system:"price",annualInterestRate:0,annualIndexRate:.10,indexationFrequency:"annual"};
  const x=project(c,"mortgage");
  eq(x.months[12].debt,1200);
  eq(entries(x,"debt-indexation")[0].debtChange,120);
  // A dívida atualizada passa a 1320; 12 pagamentos de 110, sem juros.
  eq(entries(x,"loan-principal")[12].amount,-110);
  eq(x.months[24].debt,0);
  eq(entries(x,"loan-principal").reduce((a,e)=>a-e.amount,0),2520);
});
test("oráculo Price com índice mensal de 1% mantém amortização até o prazo",()=>{
  const c=scenario({months:3,price:300});
  c.mortgage={downPayment:0,months:3,system:"price",annualInterestRate:0,monthlyIndexRates:[.01,.01,.01],indexationFrequency:"monthly"};
  const x=project(c,"mortgage");
  // mês 1: 300*1,01=303; paga 101; restam 202
  // mês 2: 202*1,01=204,02; paga 102,01; restam 102,01
  // mês 3: 102,01*1,01=103,0301; paga integral
  eq(x.months[1].debt,202);
  eq(x.months[2].debt,102.01);
  eq(x.months[3].debt,0);
  eq(entries(x,"debt-indexation").reduce((v,e)=>v+e.debtChange,0),3+2.02+1.0201,1e-7);
});
test("oráculo venda: desconto primeiro, comissão sobre preço efetivamente negociado",()=>{
  const c=scenario({months:1,price:1000});
  c.sale={sellAtEnd:true,discountRate:.10,commissionRate:.10,fixedCosts:0};
  const x=project(c,"cash");
  eq(entries(x,"sale")[0].amount,810);
  eq(x.summary.netWorth,9810);
});
test("oráculo tributo: custo fiscal informado prevalece sobre preço original",()=>{
  const c=scenario({months:1,price:800});
  c.property.marketValue=1000;
  c.sale={sellAtEnd:true,taxBasisOverride:900,capitalGainsTaxRate:.15};
  const x=project(c,"cash");
  eq(entries(x,"capital-gains-tax")[0].amount,-15);
  eq(x.summary.netWorth,10185);
});
test("oráculo caução: dinheiro vinculado, remuneração de 1% ao mês e devolução no fim",()=>{
  const c=scenario({months:2});
  c.rent={monthly:0,deposit:100,depositAnnualReturn:(1.01**12)-1};
  const x=project(c,"rent");
  eq(x.months[0].netWorth,10000);
  eq(x.months[1].deposit,101);
  eq(entries(x,"deposit-return")[0].amount,102.01);
  eq(x.months[2].netWorth,10002.01);
});
test("oráculo aluguel antecipado: exatamente N aluguéis, meses 0 até N−1",()=>{
  const c=scenario({months:3,rent:100});
  c.rent.prepaid=true;
  const x=project(c,"rent");
  assert.deepEqual(entries(x,"rent").map(e=>e.month),[0,1,2]);
  eq(x.summary.netWorth,9700);
});
test("oráculo reserva: transferência neutra, obra é despesa líquida e saldo preservado",()=>{
  const c=scenario({months:2});c.property.initialMaintenanceReserve=500;
  c.property.maintenanceMonthly=100;
  const x=project(c,"cash");
  eq(x.months[0].netWorth,10000);
  eq(x.months[1].reserve,400);
  eq(x.months[2].reserve,300);
  eq(x.summary.netWorth,9800);
});
test("oráculo real: inflação 10% e valorização real 1% compõem em 11,1%",()=>{
  const c=scenario({months:12,price:10000,cash:10000});
  c.inflationAnnual=.10;c.property.appreciationRealAnnual=.01;
  const x=project(c,"cash");
  eq(x.summary.property,11110,1e-5);
  eq(x.summary.netWorthReal,10100,1e-5);
});
test("oráculo de liquidez: falta de caixa não fica escondida no patrimônio final",()=>{
  const c=scenario({cash:500,price:1200,months:1});c.minimumReserve=100;c.negativeCashAnnualRate=0;
  const x=project(c,"cash");
  eq(x.months[0].cash,-700);
  eq(x.summary.peakShortfall,800);
  assert.ok(x.warnings.some(s=>s.includes("reserva mínima")));
});
test("versões incompatíveis, preços e encargos inválidos são rejeitados",()=>{
  for(const v of ["2.0","999",null]){
    const c=scenario();c.schemaVersion=v;assert.throws(()=>validate(c));
  }
  const c=scenario();c.mortgage.months=0;assert.throws(()=>validate(c));
  c.mortgage.months=12;c.mortgage.insuranceMonthly=-10;assert.throws(()=>validate(c));
  c.mortgage.insuranceMonthly=0;c.strategies=["cash","cash"];assert.throws(()=>validate(c));
});
test("propriedades patrimoniais permanecem reconciliadas em 300 cenários sintéticos",()=>{
  let seed=17;
  const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  for(let caseNo=0;caseNo<300;caseNo++){
    const n=1+Math.floor(rnd()*120),price=10000+rnd()*300000,cash=20000+rnd()*350000;
    const c=scenario({months:n,price,cash,rent:rnd()*3000,monthly:rnd()*2000});
    c.inflationAnnual=rnd()*.10-.02;c.investmentAnnualNet=rnd()*.20;c.negativeCashAnnualRate=.25;
    c.property.appreciationRealAnnual=rnd()*.08-.04;
    c.property.condoMonthly=rnd()*1500;
    c.property.maintenanceMonthly=rnd()*300;
    c.rent.deposit=rnd()*4000;
    c.mortgage.downPayment=rnd()*price;c.mortgage.months=12+Math.floor(rnd()*120);
    c.mortgage.annualInterestRate=rnd()*.2;
    c.mortgage.annualIndexRate=rnd()*.1;
    c.mortgage.system=rnd()>.5?"price":"sac";
    c.seller.downPayment=rnd()*price;c.seller.months=12+Math.floor(rnd()*120);
    c.seller.annualInterestRate=rnd()*.18;
    c.consortium.credit=rnd()*price;c.consortium.remainingDebt=rnd()*price;c.consortium.months=12+Math.floor(rnd()*120);
    c.sale.sellAtEnd=rnd()>.5;c.sale.discountRate=rnd()*.15;c.sale.commissionRate=rnd()*.08;
    const results=compare(c).results;
    assert.equal(results.length,5);
    for(const x of results){
      assert.equal(x.months.length,n+1);
      for(const m of x.months){
        eq(m.netWorth,m.cash+m.property+m.deposit+m.reserve-m.debt,1e-5);
        assert.ok(Number.isFinite(m.realNetWorth));
        assert.ok(m.debt>=-1e-7,"Saldo de dívida negativo");
      }
      if(x.kind!=="rent"&&c.sale.sellAtEnd){eq(x.summary.debt,0);eq(x.summary.property,0);}
    }
  }
});
