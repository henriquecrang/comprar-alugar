# Matriz de fontes brasileiras e limites do motor — revisão em 23/11/2026

**Escopo:** documentação técnica, não parecer jurídico/tributário. Links são fontes primárias ou páginas institucionais consultadas nesta revisão. A existência de uma regra legal **não** implica que o motor já a implemente.

| Item / campo | Fonte oficial | Natureza da regra | Estado do motor | Próxima ação |
| --- | --- | --- | --- | --- |
| Multa proporcional \`rent.penaltyMode\` | [Lei 8.245/1991, art. 4º](https://www.planalto.gov.br/ccivil_03/leis/l8245compilado.htm) | Contratual com proporcionalidade e exceções legais | Fórmula parametrizada simplificada | Tratar hipóteses de dispensa de multa e calendário real do contrato em #15 |
| Caução \`rent.deposit\` e remuneração | [Lei 8.245/1991, art. 38, §2º](https://www.planalto.gov.br/ccivil_03/leis/l8245compilado.htm) | Caução em dinheiro até três aluguéis; poupança e vantagens ao locatário | Saldo vinculado e retorno editável; não verifica limite nem poupança oficial | #14 |
| Taxação de venda \`sale.taxPolicy\` | [Receita — alíquotas de ganhos de capital](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/ganhos-de-capital/aliquotas) | Progressão em 15%, 17,5%, 20% e 22,5% por faixas de ganho | Progressão matemática por faixas, ou alíquota efetiva manual | #19 para múltiplas operações, regimes especiais e GCAP |
| Único imóvel até R$ 440 mil | [Receita — operações não sujeitas](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/ganhos-de-capital/operacoes-nao-sujeitas) | Exige único imóvel e ausência de alienação em cinco anos; regras de copropriedade | Somente habilitada com declarações explícitas do usuário e preço bruto até limite | #19 |
| Reinvestimento em outro residencial | [Receita — operações não sujeitas](https://www.gov.br/receitafederal/pt-br/assuntos/meu-imposto-de-renda/pagamento/ganhos-de-capital/operacoes-nao-sujeitas) | Condições de 180 dias e periodicidade do benefício | **Não automatizado** | #19, evento de compra subsequente |
| Base fiscal, benfeitorias e reduções históricas | [IN RFB 1.500/2014 (anotada)](https://normas.receita.fazenda.gov.br/sijut2consulta/link.action?idAto=57670&visao=anotado) | Regras detalhadas sujeitas a documentos e fatores FR1/FR2 | Campo de base fiscal documentada e incrementos explícitos; não calcula todos os fatores | #19, confronto com GCAP |
| CET bancário \`mortgage\` | [Resolução CMN 4.881/2020](https://www.bcb.gov.br/estabilidadefinanceira/exibenormativo?numero=4881&tipo=Resolu%C3%A7%C3%A3o+CMN), [FAQ BCB](https://www.bcb.gov.br/meubc/faqs/s/emprestimos-e-financiamentos) | CET é métrica informativa agregada de juros, taxas, tarifas e outros encargos | Encargos lançados isoladamente; **não** cobra o CET de novo nem declara conferência formal | #11: reconciliar CET, MIP/DFI, TR/IPCA e propostas |
| Consórcio \`consortium\` | [FAQ BCB](https://www.bcb.gov.br/meubc/faqs/s/consorcio) | Crédito, reajustes e cobrança dependem do grupo/contrato | Somente saldo e encargos simplificados parametrizados; sem presunção de transferência/liberação | #13 |
| FGTS para aquisição | [CAIXA — utilização FGTS na casa própria](https://www.caixa.gov.br/voce/habitacao/Paginas/utilizacao-fgts.aspx) | Requisitos pessoais, imóvel, localização, vínculo e enquadramento a conferir | **Não automatizado.** Não presume que saldo FGTS esteja disponível | #9 e #11 |
| ITBI \`property.acquisitionRate\` | Competência municipal e legislação da cidade do imóvel; [exemplo municipal: Goiânia, LC 344/2021](https://www.goiania.go.gov.br/html/gabinete_civil/sileg/dados/legis/2021/lC_20210930_000000344.html) | Alíquota/base e procedimentos variam por município | Taxa única **editável**, nunca alíquota nacional presumida | #4 e #9: fonte local por município |
| Registro e emolumentos \`property.acquisitionFixed\` | Normas estaduais e tabelas de cartórios do local | Regras estaduais, tabelas por valor | Despesa inicial editável | #9 |
| IPTU \`property.iptuMonthly\` | Município competente, cadastro e lançamento anual | Tributo municipal | Provisionamento mensal equivalente editável | #16: calendário efetivo e reajustes |
| Condomínio \`property.condoMonthly\` / \`rent.condoMonthly\` | [Lei 8.245/1991](https://www.planalto.gov.br/ccivil_03/leis/l8245compilado.htm), contrato/convenção | Distinguir despesas ordinárias e extraordinárias | Dois campos editáveis; não presume mesma cobrança | #16–#17 |

## Exemplos de decisão versus dados de contrato

- **Taxa nominal / CET:** o usuário informa juros e encargos separadamente; **não se adiciona CET como juros**. O CET informado deve ser usado como referência para auditoria, não como parcela adicional.
- **Atualização de dívida:** indexação não é um pagamento de caixa. O lançamento \`debt-indexation\` tem \`cashChange: 0\`, \`debtChange\` explícito e as prestações SAC/Price são recalculadas sobre o prazo restante. O cronograma exato é hipótese técnica, não representa automaticamente TR, IPCA, INCC ou todas as convenções bancárias.
- **Venda:** corretagem sobre preço bruto efetivamente negociado após desconto; custos em separado; \`sale.taxBasisOverride\` admite custo fiscal registrado. Tributação ainda precisa de verificações do usuário.
- **Aluguel:** penalidade proporcional só quando parametrizada, sem assumir automaticamente prazo restante ou isenção; caução remunerada com taxa **informada**, não simulada como série oficial de poupança.
- **Crédito contemplado:** não assumir que a compra de uma cota dá direito automático à transferência ou disponibilização do crédito. Cada administradora e contrato deve ser conferido.
- **FGTS:** nenhuma receita ou abatimento é computado por omissão; o saldo disponível para moradia própria **não** equivale necessariamente ao saldo total da conta.

## Critério de uso

O resultado atual é um cenário analítico. Antes de basear uma decisão de compra, anexar e confrontar: proposta bancária/cronograma, termo de compra e venda, regimento/convenção e previsão de despesas condominiais, cálculo municipal do ITBI, guia de IPTU, custos cartorários e simulação GCAP. Campos com metadados \`metadata.assumptions\` podem apontar para essa evidência, com referência e grau de confiança.
