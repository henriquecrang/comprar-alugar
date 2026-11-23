# Comprar ou Alugar — simulador patrimonial imobiliário

**Versão beta de um simulador aberto para comparar aluguel residencial com compra à vista, financiamento, parcelamento direto ou carta contemplada de consórcio.** Considera patrimônio líquido mensal, renda financeira alternativa, necessidade de caixa, manutenção, valorização, dívida e resultado após venda/manutenção.

## Rodar localmente
Requer **Node.js 22+** para testes/CLI e um servidor HTTP estático para a interface.

```bash
python3 -m http.server 8080
# depois abrir http://localhost:8080/
npm test
node cli.mjs presets/rio-exemplo.json > resultado.json
python3 main.py presets/rio-exemplo.json > resultado-pelo-python.json
```

A interface é JavaScript sem backend. O `main.py` chama o motor JavaScript pelo Node — **não** existe cópia Python das fórmulas. Veja [ADR-001](docs/adr-001-arquitetura.md).

## O que já funciona
- Cinco alternativas: aluguel, à vista, financiamento SAC/Price, parcelamento direto simplificado, carta contemplada simplificada.
- Lançamentos mensais, investimentos/deficits de caixa, valor de imóvel, saldo devedor, quitação/venda ou retenção.
- Inflação e valorização real, despesas recorrentes, reformas, taxas editáveis, aluguel e caução com rendimento.
- IR progressivo ilustrativo e opção condicionada de isenção para único imóvel (as hipóteses **não** substituem GCAP), multa manual ou proporcional de saída do aluguel.
- Painel de patrimônio líquido real/nominal, gráfico, custo mensal equivalente, memória mensal, teste de sensibilidade e aluguel de equilíbrio.
- JSON de configuração, import/export, autosave local; ledger CSV; preset ilustrativo do Rio de Janeiro; suíte CI de testes.

## Limitações importantes
**Não está pronto para decisões contratuais sem conferência.** CET, indexadores reais de contratos, taxas bancárias, parcelamento na planta/INCC, regras complexas de consórcio, IR com fatores de redução e isenção de reinvestimento, obras estruturais e risco geográfico ainda precisam de desenvolvimento. O simulador não coleta cotações automaticamente. Avaliação de mercado e custo fiscal não são a mesma coisa. Importações devem ser revisadas.

Não há QA realizado em navegador real nesta rodada nem publicação GitHub Pages confirmada; configurar Pages e testar interface são pendências explícitas.

## Documentação e backlog
- **[Pesquisa, inventário de variáveis e roadmap](docs/plano-e-especificacao.md)** — especificação inicial e 42 entregas.
- **[Issues abertas e encerradas](https://github.com/henriquecrang/comprar-alugar/issues?q=)** — execução verificável.
- [ADR da arquitetura](docs/adr-001-arquitetura.md)
- [Fontes e limites jurídicos](docs/fontes-juridicas.md)
- [Workflow de desenvolvimento](docs/workflow-desenvolvimento.md)
- [Manual de uso](docs/manual.md)

Referências conceituais: [custo-veiculo](https://github.com/henriquecrang/custo-veiculo), [cenarios-consorcio](https://github.com/henriquecrang/cenarios-consorcio), [viabilidade-airbnb](https://github.com/henriquecrang/viabilidade-airbnb).

## Privacidade
Configurações editadas ficam no navegador do usuário via localStorage e podem ser baixadas. Não insira contratos, CPF, senhas e dados identificáveis no repositório público. O site é uma ferramenta analítica, não aconselhamento jurídico, financeiro ou tributário.
