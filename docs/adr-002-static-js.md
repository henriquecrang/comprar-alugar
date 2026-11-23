# ADR-002 — Aplicação 100% estática, JavaScript nativo e GitHub Pages

**Status: aceito, substitui a ADR-001.** **Data: 23/11/2026.** **Issues: #45, #46, #47, #48.**

## Contexto e decisão

O mantenedor definiu que este e os demais simuladores financeiros são **sites estáticos em HTML, CSS e JavaScript puro**, hospedados diretamente pelo GitHub Pages. Não utilizamos backend, Python, framework de UI, bundler, transpiler nem processo de build para disponibilizar a aplicação.

A interface (`index.html`, `styles.css`, `app.js`) importa módulos JavaScript ES nativos (`.mjs`) por caminhos relativos. `model-api.mjs` é a **interface pública estável** do motor; `engine.mjs` contém as regras financeiras e `analysis.mjs` as análises de sensibilidade. Os dados entram/saem em JSON versionado. O browser executa todos os cálculos e guarda cenários apenas localmente.

## Separação de execução e desenvolvimento

- **Produção:** um navegador moderno recebe exclusivamente arquivos estáticos e executa JavaScript localmente. Não depende de Python, Node.js, npm, servidor de aplicação, credenciais nem serviços externos.
- **Desenvolvimento e CI:** Node.js 22+ pode executar os testes (`node --test`), um servidor HTTP local de desenvolvimento (`node tests/serve.mjs`) e o CLI JavaScript opcional (`node cli.mjs presets/rio-exemplo.json`). Essas ferramentas não participam da execução do site.
- **Deploy:** `actions/upload-pages-artifact` publica os arquivos diretamente, sem geração de bundle. Testes financeiros e smoke tests no Chrome antecedem o deploy; outro smoke test verifica a URL publicada.
- **Integração futura:** consumidores JavaScript importam `model-api.mjs`; interoperabilidade com outras linguagens ocorre por JSON, sem wrapper Python mantido neste repositório.

## Contrato JS público

```js
import { compare, project, validate, MODEL_API_VERSION } from './model-api.mjs';
const resultado = compare(configuracaoJson);
```

Os exports públicos são `compare(config)`, `project(config, kind)`, `validate(config)` e `MODEL_API_VERSION`. São funções sem acesso ao DOM, sem chamadas de rede e sem importação de módulos exclusivos do Node; preservam as regras e saídas atuais. A entrada é validada pelo motor; o resultado de `compare` inclui `engineVersion`, `schemaVersion`, `results` e `leader`. Incompatibilidades futuras exigem evolução explícita do schema/API e testes de paridade entre Node e navegador.

## Consequências e restrições

1. `main.py` foi removido. A issue #29 é uma entrega **histórica superada**, não um requisito atual.
2. Node.js não é exigido por visitantes do GitHub Pages; arquivos `.mjs` funcionam diretamente com ES Modules HTTP.
3. Abrir o `index.html` por `file://` pode sofrer restrições do navegador; testar localmente com servidor HTTP simples.
4. A auditoria financeira permanece independente da interface. Não duplicar cálculo no DOM nem confundir patrimônios, amortização, reservas e custo de oportunidade.
5. Alterar contratos, impostos, taxas e dados financeiros exige documentação e testes; nenhuma premissa ilustrativa substitui fonte oficial.

## Histórico

A [ADR-001](adr-001-arquitetura.md) adotava temporariamente um wrapper Python como CLI local. Essa decisão foi substituída a pedido do mantenedor; manter a ADR-001 como registro histórico, mas **não utilizar suas instruções de execução ou integração Python**.
