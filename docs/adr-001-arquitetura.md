# ADR-001 — motor único, web estática e CLI Python

**Data:** 23/11/2026. **Status:** decisão inicial reversível. **Issues:** #1, #3, #6, #29.

## Decisão
O motor financeiro canônico será JavaScript ESM puro (`engine.mjs`), sem DOM nem dependências externas. A aplicação web consome o módulo diretamente; Node.js 22+ executa testes e um CLI nativo (`cli.mjs`). O `main.py` separado chama o CLI usando `subprocess` e stdin/arquivo JSON. **Não reimplementamos fórmulas em Python**: isso evita divergência em juros, eventos, impostos e cálculos patrimoniais. Saída é JSON estruturado.

## Justificativa
- GitHub Pages executa JavaScript no cliente, não Python num backend; o motor fica imediatamente hospedável sem servidor e sem Pyodide pesado.
- A integração futura com sistemas Python utiliza `main.py` ou importação de JSON; requer instalação local de Node, compromisso explícito.
- Se requisito posterior exigir Python puro sem Node, será uma decisão e migração específica, com fixtures de paridade antes de qualquer troca de engine.
- Testes com `node --test` são reprodutíveis e CI pode rodar sem credenciais.

## Restrições
- Simulações de browser feitas localmente sem enviar dados; nunca publicar dados pessoais no repositório.
- Um único schema JSON versionado na entrada, validação no motor, migrações adiante.
- Valores de juros, índices e alíquotas do preset são **hipóteses editáveis**, não dados automáticos.
- Em eventos com custos extraordinários ou imposto, simulação só assume taxas explicitamente informadas.
- A lógica de débito residual do consórcio é **provisória** e não substitui o contrato. Preservar aviso em tela e backlog.
