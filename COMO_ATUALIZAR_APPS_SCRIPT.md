# Como atualizar o Apps Script com a ponte da API

## Antes de começar
1. Abra o projeto Apps Script existente.
2. Faça uma cópia de segurança do conteúdo atual de `Code.gs` (copie para um arquivo local chamado `Code.gs.backup`).
3. Não apague nem altere `Index.html` ou os outros arquivos do projeto atual.

## Atualizar
1. Abra o arquivo `backend-apps-script/Code.gs` deste pacote.
2. Copie todo o conteúdo e substitua o conteúdo de `Code.gs` no editor do Apps Script.
3. Salve o projeto.
4. Em Configurações do projeto > Propriedades do script, confirme que existem:
   - `FRETES_SPREADSHEET_ID` = ID da planilha correta.
   - `FRETES_API_TOKEN` = o mesmo segredo configurado no servidor Next.js.
5. Não envie o token para o frontend, não o inclua em arquivos `NEXT_PUBLIC_*` e não o publique em repositório.

## Implantar uma nova versão
1. Clique em Implantar > Gerenciar implantações.
2. Edite a implantação de Aplicativo da Web existente (ou crie uma nova, se necessário).
3. Em Versão, selecione Nova versão.
4. Mantenha a política de execução/acesso compatível com sua operação e com as regras da organização.
5. Implante e copie a URL que termina em `/exec` para a variável `FRETES_APPS_SCRIPT_URL` no servidor Next.js.

## Testes obrigatórios antes do uso
- Teste primeiro uma chamada de leitura (`initial`) pelo painel.
- Teste pesquisa exata de CODCLI e pesquisa parcial.
- Faça um lançamento controlado somente após as leituras funcionarem; confirme a resposta `ok: true` e a nova linha em `HISTÓRICO`.
- Confirme que o `Tipo` foi escrito na coluna N e que as fórmulas das colunas X:AB continuam intactas.
- Se falhar, volte à implantação anterior pelo menu Gerenciar implantações; mantenha o backup de `Code.gs`.

## Limitações conhecidas
- O Apps Script retorna erros como JSON; o servidor Next.js precisa estar configurado com `FRETES_APPS_SCRIPT_URL` e o mesmo `FRETES_API_TOKEN`.
- A validação estática não substitui teste contra a implantação real. Não considere produção homologada até concluir os testes acima.
