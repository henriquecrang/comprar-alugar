# Catálogo e contrato de parâmetros — v1.0

**Fonte normativa deste arquivo:** [schema JSON](../schema/scenario.schema.json). O motor e a importação validam adicionalmente invariantes envolvendo múltiplos campos (prazos, crédito ≤ preço, extensão de séries, taxas de venda combinadas e overrides por estratégia).

| Seção | Natureza | Unidade | Origem padrão |
| --- | --- | --- | --- |
| Geral | Capital inicial, aportes, reserva, inflação e investimento | BRL, BRL/mês, taxa efetiva anual em fração | Usuário/preset ilustrativo |
| property | Preço, custos iniciais, manutenção, condomínio, IPTU, obras, valorização | BRL, BRL/mês, taxa anual | Usuário, prefeitura, cartório, orçamento |
| rent | Aluguel, reajuste, caução, rescisão, garantias | BRL, BRL/mês, taxa anual | Contrato de locação |
| mortgage | Entrada, SAC/Price, juros, índice, seguros, taxas e amortizações | BRL, taxa anual/mensal, meses | Proposta bancária |
| seller | Condições parceladas, juros, reajuste, despesas e prazo | BRL, taxa efetiva, meses | Contrato vendedor/incorporadora |
| consortium | Crédito disponível, preço da cota, saldo, encargos e prazo | BRL, taxa anual, meses | Administradora e contrato |
| sale | Venda, desconto, corretagem, custo fiscal, IR | BRL, fração | Proposta, Receita/GCAP |
| monthlyRates | Curvas de inflação, investimento, déficit e prêmio do imóvel | taxa **mensal** em fração | Cenário explícito |
| strategyOverrides | Custos específicos de cada modalidade, sem mudar horizonte/capital | mesmos campos de origem | Usuário |
| housingEquivalence | Bairro, área, quartos e tipo, por alternativa | m², inteiro, texto | Usuário/anúncio |
| metadata | Data-base, moeda BRL, fonte, confiança e notas por premissa | ISO YYYY-MM-DD, BRL | Usuário |

### Regras de conversão e segurança
- **10% = 0.10**, não 10. Juros anuais são efetivos e mensalizados por \`(1+r)^(1/12)-1\`.
- Campos monetários são valores **nominais**. O valor real é resultado deflacionado.
- \`schemaVersion\` = \`1.0\`. Versões desconhecidas são recusadas antes do cálculo. JSONs antigos **sem versão** são migrados explicitamente para v1.0; não há migração fictícia de versões com layout desconhecido.
- Campos desconhecidos são rejeitados na importação para impedir silenciosamente erros de digitação.
- \`metadata.assumptions\` registra fonte, data e confiança por campo, como \`"mortgage.annualInterestRate": {"source":"proposta", "referenceDate":"2026-11-23", "confidence":"high"}\`.
- Overrides podem alterar **custos/receitas próprios** de uma estratégia, mas não o mesmo capital inicial, horizonte ou transferência de dívida. Exemplos: \`{"mortgage":{"mortgage":{"insuranceMonthly":175}}}\` e \`{"cash":{"property":{"maintenanceMonthly":400}}}\`.
- \`housingEquivalence.buy\` e \`housingEquivalence.rent\` não alteram caixa. Diferenças de área >10%, quartos, bairro e tipo geram aviso, sem impedir ranking.
- Dados ilustrativos não substituem condições de um contrato real. **Não interpretar IR zero como isenção**.
- JSON exportado pela interface contém configuração; os resultados são recalculáveis a partir dela. Histórico de execução pode ser preservado fora do JSON de entrada.

### Calendário de eventos
\`month: 0\` é aquisição/entrada/caução. \`month: 1…N\` são eventos mensais, rendimentos, aportes e, em N, alienação se selecionada. Todo evento de caixa possui \`id\`, \`month\`, \`category\`, \`amount\`, \`cashChange\`, \`source\` e descrição. Correção monetária do saldo devedor aparece em evento **não monetário**, com \`amount:0\` e \`debtChange\`, para não ser confundida com prestação. Fluxos líquidos são reconciliados com \`months[m].cash\`.

### Estratégias e equivalência
As modalidades compartilham capital inicial, fonte externa de recursos, inflação, horizonte e necessidade de moradia. O aplicativo avisa se não houver informações de comparabilidade e não transforma diferenças qualitativas em ganhos financeiros falsos. Ao aplicar custos por estratégia, exibe advertência adicional para revisão.

### Migração e armazenamento local
O contrato v1 aceita JSON legado sem \`schemaVersion\`, completando apenas a versão e, quando ausente, a lista explícita padrão de estratégias aplicáveis (\`rent\`, \`cash\` e outras se houver condições definidas). Dados desconhecidos/incompatíveis não são apagados silenciosamente do localStorage; a interface oferece backup do conteúdo original.
