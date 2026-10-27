# Implantação — Central de Gestão de Fretes

1. Publique o `backend-apps-script/Code.gs` no projeto Apps Script da planilha e mantenha o arquivo `Index.html` existente no mesmo projeto se a interface antiga ainda for necessária.
2. Em Configurações do projeto > Propriedades do script, configure `FRETES_SPREADSHEET_ID` com o ID da planilha e `FRETES_API_TOKEN` com um segredo longo e aleatório.
3. Implante como Aplicativo da Web, executando como proprietário. Escolha a política de acesso adequada à organização. A API `doPost` valida o token; não exponha o token no navegador.
4. No provedor do Next.js, configure `FRETES_APPS_SCRIPT_URL` com a URL `/exec` da implantação e `FRETES_API_TOKEN` com o mesmo segredo. São variáveis exclusivamente do servidor; não use prefixo `NEXT_PUBLIC_`.
5. Instale dependências e execute `npm run build`. O ambiente de preparação desta revisão não conseguiu concluir a instalação/build por limite de tempo, portanto essa validação ainda é necessária.
6. Antes de liberar, testar: busca exata CODCLI, busca parcial, gravação controlada, retorno de erro sem sucesso falso, histórico, relatório CSV e integridade das fórmulas X:AB.

Nunca coloque o token em repositório público, arquivo de frontend ou conversa. Se a URL de implantação for renovada, atualize a variável de ambiente.
