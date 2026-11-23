import {readFileSync} from "node:fs";
import {compare} from "./model-api.mjs";
try {
  const input=process.argv[2] ? readFileSync(process.argv[2],"utf8") : readFileSync(0,"utf8");
  const config=JSON.parse(input);
  const output=compare(config);
  process.stdout.write(JSON.stringify(output,null,2)+"\n");
} catch (error) {
  process.stderr.write("Erro na simulação: "+error.message+"\n");
  process.exitCode=1;
}
