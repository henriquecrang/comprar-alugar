import {compare,project} from "./engine.mjs";
function copy(obj){return JSON.parse(JSON.stringify(obj));}
function change(input,path,value){
  const o=copy(input),parts=path.split(".");let curr=o;
  for(const p of parts.slice(0,-1)){curr[p]??={};curr=curr[p]}
  curr[parts.at(-1)]=value;return o;
}
function evaluation(config,field,value,first,second){
  const input=change(config,field,value);
  const a=project(input,first).summary.netWorthReal,b=project(input,second).summary.netWorthReal;
  return {input:value,first:a,second:b,difference:a-b,leader:a>=b?first:second};
}
function sweep(config,field,values,first="cash",second="rent"){
  if(!Array.isArray(values))throw new Error("Série de sensibilidade inválida");
  return values.map(v=>evaluation(config,field,v,first,second));
}
function breakEven(config,field,first,second,min,max,steps=64){
  if(!Number.isFinite(min)||!Number.isFinite(max)||max<=min)throw new Error("Faixa de equilíbrio inválida");
  let last=evaluation(config,field,min,first,second),interval=null;
  if(Math.abs(last.difference)<0.005)return {value:min,difference:0,comparison:[first,second]};
  for(let j=1;j<=steps;j++){
    const next=evaluation(config,field,min+(max-min)*j/steps,first,second);
    if(last.difference*next.difference<=0){interval=[last,next];break}
    last=next;
  }
  if(!interval)return {value:null,reason:"sem cruzamento na faixa pesquisada",comparison:[first,second]};
  let [lo,hi]=interval;
  for(let i=0;i<50;i++){
    const mid=evaluation(config,field,(lo.input+hi.input)/2,first,second);
    if(Math.abs(mid.difference)<0.005||Math.abs(lo.input-hi.input)<1e-10)return {value:mid.input,difference:mid.difference,comparison:[first,second]};
    if(lo.difference*mid.difference<=0)hi=mid;else lo=mid;
  }
  const mid=evaluation(config,field,(lo.input+hi.input)/2,first,second);
  return {value:mid.input,difference:mid.difference,comparison:[first,second]};
}
function firstWinningMonth(config,first="cash",second="rent",maxMonths=240){
  const selected=copy(config);
  const winners=[];
  for(let month=1;month<=maxMonths;month++){
    selected.months=month;
    const a=project(selected,first).summary.netWorthReal,b=project(selected,second).summary.netWorthReal;
    if(a>=b)winners.push(month);
  }
  return {firstMonth:winners[0]??null,lastMonth:winners.at(-1)??null,winningMonths:winners.length,checkedMonths:maxMonths};
}
export {change,sweep,breakEven,firstWinningMonth};
