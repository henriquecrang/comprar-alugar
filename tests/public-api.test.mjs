import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync} from "node:child_process";
import {compare, project, validate, MODEL_API_VERSION} from "../model-api.mjs";
import * as exported from "../model-api.mjs";
import {compare as internalCompare} from "../engine.mjs";
const preset=JSON.parse(readFileSync(new URL("../presets/rio-exemplo.json", import.meta.url),"utf8"));
test("API publica documentada e versao estavel",()=>{
 assert.deepEqual(Object.keys(exported).sort(),["MODEL_API_VERSION","compare","project","validate"].sort());
 assert.equal(MODEL_API_VERSION,"1.0"); assert.equal(validate(preset),true);
 const result=compare(preset); assert.equal(result.schemaVersion,"1.0"); assert.equal(result.engineVersion,"0.1.0");
 assert.ok(result.results.length>=2); assert.equal(typeof result.leader,"string");
});
test("motor e API apresentam saídas identicas sem mutar entradas",()=>{
 const before=JSON.stringify(preset);
 const throughApi=compare(preset); const directly=internalCompare(preset);
 assert.deepEqual(throughApi,directly); assert.equal(JSON.stringify(preset),before);
 assert.deepEqual(compare(JSON.parse(JSON.stringify(preset))),throughApi);
 assert.deepEqual(project(preset,"rent"),directly.results.find(x=>x.kind==="rent"));
});
test("CLI JS opcional devolve a mesma saida do navegador e da API",()=>{
 const output=execFileSync(process.execPath,[new URL("../cli.mjs",import.meta.url).pathname,new URL("../presets/rio-exemplo.json",import.meta.url).pathname],{encoding:"utf8"});
 assert.deepEqual(JSON.parse(output),compare(preset));
});
test("grafo publico nao usa Node nem DOM e pagina importa o modulo estavel",()=>{
 const api=readFileSync(new URL("../model-api.mjs",import.meta.url),"utf8");
 const engine=readFileSync(new URL("../engine.mjs",import.meta.url),"utf8");
 const app=readFileSync(new URL("../app.js",import.meta.url),"utf8");
 for(const code of [api,engine]){
  assert.doesNotMatch(code,/\b(?:window|document|localStorage|process|require)\s*[.(\[]/);
  assert.doesNotMatch(code,/\bfrom\s+[\x27\x22]node:/);
 }
 assert.match(app,/from\s+[\x27\x22]\.\/model-api\.mjs[\x27\x22]/);
});
