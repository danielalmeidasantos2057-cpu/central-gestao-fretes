# Status da integração — revisão 3

## Telas migradas para dados reais da API
- Dashboard: KPIs, distribuição por tipo/mês e lançamentos recentes via Apps Script.
- Histórico: pesquisa, filtros, paginação e detalhes via Apps Script.
- Lançamento: pesquisa exata de CODCLI, busca avançada, transportadoras e gravação via Apps Script.
- Clientes: pesquisa por CODCLI/nome/cidade na aba CADASTRO.
- Transportadoras: ranking por valor de frete calculado a partir do HISTÓRICO; não inventa índice de pontualidade.
- Consultas: consulta exata por NF ou CODCLI no HISTÓRICO. Protocolo foi removido porque não existe campo de protocolo no contrato de dados atual.
- Análises: gráficos de valor por tipo e transportadora usando agregações da API.
- Relatórios: exportação CSV dos dados reais retornados pelo HISTÓRICO, com relatórios gerais, dedicados e CIF/FOB. Exportação limitada a 5.000 registros por execução.

## Regras de planilha preservadas no código
- `HISTÓRICO!N` permanece o campo `Tipo`, com Dedicado, Transferência, CIF e FOB.
- A API lê/grava somente A:W; fórmulas X:AB não são sobrescritas.
- Data de entrega continua opcional.
- Busca exata de CODCLI não seleciona correspondências aproximadas automaticamente.

## Pendências antes de produção
- Configurar `FRETES_APPS_SCRIPT_URL` e `FRETES_API_TOKEN` como variáveis de ambiente do servidor Next.js.
- Configurar `FRETES_API_TOKEN` e `FRETES_SPREADSHEET_ID` em Script Properties do Apps Script.
- Fazer build completo com dependências instaladas e testar contra uma implantação real.
- Executar teste controlado de gravação e confirmar que as fórmulas X:AB permanecem intactas.
- A data de coleta do formulário não possui coluna independente no contrato atual e não é gravada em campo alternativo.

## Estado
Integração de frontend implementada no código, ainda não homologada contra a implantação real. Não usar em produção antes dos testes listados acima.
