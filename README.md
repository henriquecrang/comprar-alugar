# Comprar ou Alugar — simulador patrimonial imobiliário

**Versão beta de um simulador aberto para comparar aluguel residencial com compra à vista, financiamento, parcelamento direto ou carta contemplada de consórcio.** Considera patrimônio líquido mensal, renda financeira alternativa, necessidade de caixa, manutenção, valorização, dívida e resultado após venda/manutenção.

## Executar no navegador

**[Abrir o simulador no GitHub Pages](https://henriquecrang.github.io/comprar-alugar/)**. A aplicação usa **HTML, CSS e JavaScript puro**, sem backend, Python, Node.js, framework, bundler ou build na produção.

Para desenvolver e testar localmente (Node.js 22+ **somente para desenvolvimento**):

```bash
node tests/serve.mjs
# abrir http://localhost:8080/comprar-alugar/
npm test
node cli.mjs presets/rio-exemplo.json > resultado.json
npm run smoke          # requer Chrome/Chromium instalado
```

O motor financeiro canônico é o módulo ES `engine.mjs`, exposto pela API pública `model-api.mjs`; o CLI `cli.mjs` é uma ferramenta opcional de desenvolvimento. Veja [ADR-002](docs/adr-002-static-js.md).

## O que já funciona
- Cinco alternativas: aluguel, à vista, financiamento SAC/Price, parcelamento direto simplificado, carta contemplada simplificada.
- Lançamentos mensais, investimentos/deficits de caixa, valor de imóvel, saldo devedor, quitação/venda ou retenção.
- Inflação e valorização real, despesas recorrentes, reformas, taxas editáveis, aluguel e caução com rendimento.
- IR progressivo ilustrativo e opção condicionada de isenção para único imóvel (as hipóteses **não** substituem GCAP), multa manual ou proporcional de saída do aluguel.
- Painel de patrimônio líquido real/nominal, gráfico, custo mensal equivalente, memória mensal, teste de sensibilidade e aluguel de equilíbrio.
- JSON versionado v1.0, migração de configurações antigas sem versão, import/export com validação e backup de incompatibilidades, autosave local; ledger CSV; preset ilustrativo único em `presets/rio-exemplo.json`.
- Auditoria com oráculos financeiros independentes, testes sintéticos de reconciliação e comparação de padrões de moradia.

## Limitações importantes
**Ainda não substitui análises contratuais e documentos reais.** CET, indexadores reais de contratos, taxas bancárias, parcelamento na planta/INCC, regras complexas de consórcio, IR com fatores de redução e isenção de reinvestimento, obras estruturais e risco geográfico ainda precisam de desenvolvimento. O simulador não coleta cotações automaticamente. Avaliação de mercado e custo fiscal não são a mesma coisa. Importações devem ser revisadas.

**GitHub Actions confirmou a implantação no Pages em 23/11/2026**: https://henriquecrang.github.io/comprar-alugar/. A refatoração posterior confirmou smoke HTTPS com Chrome real no Pages; ainda faltam QA visual/manual completo, acessibilidade e auditoria contratual específica (issues #33 e #34).

## Documentação e backlog
- **[Pesquisa, inventário de variáveis e roadmap](docs/plano-e-especificacao.md)** — especificação inicial e 42 entregas.
- **[Issues abertas e encerradas](https://github.com/henriquecrang/comprar-alugar/issues?q=)** — execução verificável.
- [ADR-002 — arquitetura JS puro e estático](docs/adr-002-static-js.md)
- [API pública JavaScript](docs/api-js.md)
- [Fontes e limites jurídicos](docs/fontes-juridicas.md)
- [Workflow de desenvolvimento](docs/workflow-desenvolvimento.md)
- [Manual de uso](docs/manual.md)
- [Estado de implementação e pendências](docs/estado-implementacao.md)
- [Auditoria financeira, casos independentes e decisões](docs/auditoria-economica.md)
- [Contrato de dados, unidades e overrides](docs/catalogo-parametros.md)
- [Matriz de fontes brasileiras e limites](docs/matriz-fontes-2026.md)

Referências conceituais: [custo-veiculo](https://github.com/henriquecrang/custo-veiculo), [cenarios-consorcio](https://github.com/henriquecrang/cenarios-consorcio), [viabilidade-airbnb](https://github.com/henriquecrang/viabilidade-airbnb).

## Privacidade
Configurações editadas ficam no navegador do usuário via localStorage e podem ser baixadas. Não insira contratos, CPF, senhas e dados identificáveis no repositório público. O site é uma ferramenta analítica, não aconselhamento jurídico, financeiro ou tributário.
