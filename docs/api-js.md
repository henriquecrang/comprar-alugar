# API JavaScript pública — comprar-alugar

**Versão da API:** `1.0`. **Fonte de verdade:** [`model-api.mjs`](../model-api.mjs).

## Uso diretamente no navegador (ou outro projeto JS)
```js
import {validate, project, compare, MODEL_API_VERSION} from './model-api.mjs';
validate(cenario);
const resultado = compare(cenario);
const detalhes = project(cenario, 'rent');
```

Não há Node.js, Python, DOM, framework, bundler, network nem biblioteca externa no grafo de imports da API. O motor produz objetos JS serializáveis para import/export JSON. Os contratos de entrada e saída são compatíveis com `schema/scenario.schema.json` e `presets/rio-exemplo.json`.

## Operações
- `validate(config)`: lança `Error` para configurações inválidas e retorna `true` se a validação passar.
- `project(config, kind)`: calcula uma estratégia: `rent`, `cash`, `mortgage`, `seller` ou `consortium`, devolvendo ledger, trajetória de meses, `summary` e avisos.
- `compare(config)`: calcula as estratégias selecionadas e devolve `{engineVersion, schemaVersion, parameters, horizonMonths, baselineFuture, results, leader, alerts}`.
- `MODEL_API_VERSION`: versão do contrato de funções exportadas; não é versão dos dados ou do motor.

## Compatibilidade e reprodutibilidade
- Os dados de entrada têm `schemaVersion` e o resultado de `compare` informa `schemaVersion` e `engineVersion`.
- A interface e o CLI local de desenvolvimento importam `model-api.mjs` **sem copiar regras**.
- `node cli.mjs presets/rio-exemplo.json` é ferramenta opcional de desenvolvimento, não serviço de produção.
- `npm test` e o smoke test Chrome da CI comparam resultados do browser e do Node para o mesmo fixture, incluindo alteração de premissas no DOM.
- Alterações incompatíveis de schema, nomes de campos, comportamento ou arredondamento requerem versão nova, migrações e testes.
- Não vincular simuladores por URLs relativas de outros repositórios sem avaliar compatibilidade; consumir JSON ou exportar o módulo em um pacote/cópia controlada com versão.

## Exemplo mínimo
```json
{"schemaVersion":"1.0","months":12,"initialCash":200000,"property":{"price":150000},"rent":{"monthly":1500},"strategies":["rent","cash"]}
```

**Nota:** estimativas de tributação, contratos e índices não se tornam precisas por reutilizar a API; conferir as limitações descritas na documentação financeira.
