// Chrome/Chromium real, sem frameworks, pacotes npm ou build da aplicação.
import assert from "node:assert/strict";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {existsSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {startServer} from "./serve.mjs";

const exec=promisify(execFile);
const binaries=["/usr/bin/chromium","/usr/bin/google-chrome","/opt/google/chrome/chrome"];
const chrome=process.env.CHROME_BIN||binaries.find(existsSync)||"chrome";
async function dump(url){
  const profile=mkdtempSync(join(tmpdir(),"comprar-alugar-chrome-"));
  try{
    const args=["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
      "--no-first-run","--disable-background-networking","--disable-extensions",
      "--virtual-time-budget=8000","--user-data-dir="+profile,"--dump-dom",url];
    const {stdout}=await exec(chrome,args,{timeout:45000,maxBuffer:16*1024*1024,encoding:"utf8"});
    return stdout;
  }finally{rmSync(profile,{recursive:true,force:true});}
}
function assertRendered(html){
  const winner=html.match(/<strong id="winner">([^<]+)</);
  assert.ok(winner&&winner[1]&&winner[1]!=="—"&&winner[1]!=="Corrigir premissas","Resumo sem líder calculado");
  assert.match(html,/<tbody id="comparison-body">[\s\S]*?<tr/,"Tabela sem linhas de resultados");
  assert.match(html,/<polyline\b/i,"Gráfico sem trajetórias");
  assert.match(html,/id="export"/,"Exportação ausente");
}
async function retry(url,count=3){
  let error;
  for(let i=0;i<count;i++){
    try{const html=await dump(url);assertRendered(html);return html;}
    catch(caught){error=caught;if(i+1<count)await new Promise(resolve=>setTimeout(resolve,2500));}
  }
  throw error;
}
let server;
try{
  if(process.env.SMOKE_TARGET_URL){
    const target=process.env.SMOKE_TARGET_URL;
    await retry(target);
    console.log("Smoke HTTPS do GitHub Pages aprovado: "+target);
  }else{
    server=await startServer(0);
    console.log("Verificando subdiretório do Pages: "+server.url);
    const normal=await dump(server.url);
    assertRendered(normal);
    const interactive=await dump(server.url+"?qa=1");
    assertRendered(interactive);
    const qa=interactive.match(/data-browser-qa="([^"]+)"/);
    const trace=interactive.match(/<pre id="browser-qa-trace">([^<]+)/);
    assert.equal(qa?.[1],"pass","Teste interativo falhou: "+(trace?.[1]||"sem rastreio"));
    console.log("QA interativo aprovado: recálculo, persistência, JSON, CSV, gráfico e tabela.");
  }
}catch(error){
  console.error(error);
  process.exitCode=1;
}finally{if(server)await server.close();}
