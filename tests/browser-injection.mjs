// Injetado exclusivamente pelo servidor de QA: não integra a UI publicada.
import {compare} from "../model-api.mjs";
// O app carrega o preset estático de forma assíncrona; aguardar a primeira renderização.
for(let i=0;i<100&&document.querySelectorAll("#comparison-body tr").length===0;i++)
  await new Promise(resolve=>setTimeout(resolve,30));
const outcome={ok:false,checks:[]};
const expect=(condition,message)=>{if(!condition)throw new Error(message);outcome.checks.push(message);};
try{
  expect(document.querySelector("#winner")?.textContent!=="—","Resumo inicial calculado");
  expect(document.querySelectorAll("#comparison-body tr").length>=2,"Tabela inicial com estratégias");
  expect(document.querySelectorAll("#wealth-chart polyline").length>=2,"Gráfico renderizado");
  const priceInput=document.querySelector("#f-property-price");
  expect(priceInput!==null,"Preço editável");
  const changed=Number(priceInput.value)-5000;
  priceInput.value=String(changed);
  priceInput.dispatchEvent(new Event("change",{bubbles:true}));
  const saved=JSON.parse(localStorage.getItem("comprar-alugar-v1"));
  expect(saved.property.price===changed,"Alteração de premissa persiste");
  expect(document.querySelector("#winner")?.textContent!=="Corrigir premissas","Recalculo sem erro");
  expect(compare(saved).results.length===document.querySelectorAll("#comparison-body tr").length,"UI corresponde ao motor publico");
  const alternative=structuredClone(saved);
  alternative.rent.monthly+=175;
  const fileControl=document.querySelector("#upload");
  const transfer=new DataTransfer();
  transfer.items.add(new File([JSON.stringify(alternative)],"qa.json",{type:"application/json"}));
  fileControl.files=transfer.files;
  fileControl.dispatchEvent(new Event("change",{bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,150));
  const imported=JSON.parse(localStorage.getItem("comprar-alugar-v1"));
  expect(imported.rent.monthly===alternative.rent.monthly,"Importação JSON atualiza o cenário");
  const future=structuredClone(alternative);future.schemaVersion="999";
  const failed=new DataTransfer();
  failed.items.add(new File([JSON.stringify(future)],"invalido.json",{type:"application/json"}));
  fileControl.files=failed.files;fileControl.dispatchEvent(new Event("change",{bubbles:true}));
  await new Promise(resolve=>setTimeout(resolve,150));
  expect(JSON.parse(localStorage.getItem("comprar-alugar-v1")).rent.monthly===alternative.rent.monthly,
    "Importação de versão futura não sobrescreve cenário válido");
  expect(document.querySelector("#toast").textContent.includes("não suportado"),"Erro de versão fica visível");
  let blob;
  const originalCreate=URL.createObjectURL;
  const originalClick=HTMLAnchorElement.prototype.click;
  URL.createObjectURL=(value)=>{blob=value;return "blob:browser-qa"};
  HTMLAnchorElement.prototype.click=function(){};
  try{
    document.querySelector("#export").click();
    expect(blob instanceof Blob,"Exportação JSON gera Blob");
    expect(JSON.parse(await blob.text()).rent.monthly===alternative.rent.monthly,"JSON exportado preserva dados");
    blob=undefined;
    document.querySelector("#export-ledger").click();
    expect(blob instanceof Blob,"Exportação CSV gera Blob");
    expect((await blob.text()).includes("categoria"),"CSV com memória de cálculo");
  }finally{
    URL.createObjectURL=originalCreate;
    HTMLAnchorElement.prototype.click=originalClick;
  }
  expect(document.querySelector("#detail-strategy")?.options.length>=2,"Memória mensal disponível");
  outcome.ok=true;
}catch(error){outcome.error=error.stack||error.message;}
document.body.dataset.browserQa=outcome.ok?"pass":"fail";
const trace=document.createElement("pre");
trace.id="browser-qa-trace";
trace.textContent=JSON.stringify(outcome);
document.body.append(trace);
