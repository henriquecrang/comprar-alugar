// Apenas desenvolvimento e testes. App publicado não utiliza servidor Node.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve, dirname, extname, sep} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const PREFIX="/comprar-alugar/";
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",".md":"text/markdown; charset=utf-8"};

export async function startServer(port=0) {
  const server=createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,"http://localhost");
      if(!url.pathname.startsWith(PREFIX)){res.writeHead(404);res.end("Rota não encontrada");return;}
      const relative=decodeURIComponent(url.pathname.slice(PREFIX.length))||"index.html";
      const target=resolve(root,relative);
      if(!target.startsWith(root+sep)){res.writeHead(403);res.end("Caminho proibido");return;}
      let data=await readFile(target);
      if(relative==="index.html"&&url.searchParams.get("qa")==="1"){
        const html=data.toString("utf8");
        data=Buffer.from(html.replace("</body>",'<script type="module" src="./tests/browser-injection.mjs"></script>\n</body>'));
      }
      res.writeHead(200,{"Content-Type":mime[extname(target)]||"application/octet-stream","Cache-Control":"no-store"});
      res.end(data);
    }catch(error){
      res.writeHead(error.code==="ENOENT"?404:500,{"Content-Type":"text/plain; charset=utf-8"});
      res.end("Falha no servidor de teste: "+error.message);
    }
  });
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(port,"127.0.0.1",resolve);});
  return {server,url:"http://127.0.0.1:"+server.address().port+PREFIX,close:()=>new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()))};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  startServer(Number(process.env.PORT||8080)).then(({url})=>console.log("Servidor estático: "+url)).catch(error=>{console.error(error);process.exitCode=1;});
}
