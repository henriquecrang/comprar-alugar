import test from "node:test";
import assert from "node:assert/strict";
import {breakEven,sweep,firstWinningMonth} from "../analysis.mjs";
const scenario={months:12,initialCash:10000,monthlyContribution:0,investmentAnnualNet:0,inflationAnnual:0,property:{price:1000},rent:{monthly:25},sale:{sellAtEnd:true},strategies:["rent","cash"]};
test("break-even rent of flat property and zero opportunity is zero",()=>{
 const out=breakEven(scenario,"rent.monthly","cash","rent",0,100);
 assert.ok(out.value!==null);
 assert.ok(Math.abs(out.value)<0.01);
});
test("sweep higher rent makes purchasing more attractive",()=>{
 const seq=sweep(scenario,"rent.monthly",[0,10,20,40],"cash","rent");
 assert.ok(seq[0].difference<=seq[1].difference);
 assert.ok(seq[1].difference<seq[3].difference);
});
test("first-winning month handles no solution and solution",()=>{
 const yes=firstWinningMonth(scenario,"cash","rent",24);
 assert.equal(yes.firstMonth,1);
 const none=JSON.parse(JSON.stringify(scenario));none.investmentAnnualNet=.5;none.rent.monthly=0;
 assert.equal(firstWinningMonth(none,"cash","rent",24).firstMonth,null);
});
