# Guia de instalação e integração — Central de Gestão de Fretes

Este guia descreve a instalação da interface Next.js e sua ligação ao Google Apps Script. Faça primeiro a homologação com uma cópia da planilha. Não use a versão em produção até concluir os testes.

## O que você precisa

- A planilha Google Sheets correta, com as abas `CADASTRO`, `HISTÓRICO` e `TRANSPORTADOR`.
- Acesso de edição ao projeto Apps Script associado à planilha.
- Uma conta GitHub (para guardar o projeto privado) e uma conta Vercel (para hospedar o Next.js), ou outro host compatível com Next.js.
- Node.js LTS instalado no computador para testar localmente. Baixe do site oficial `https://nodejs.org/`.

## Parte 1 — Preparar a planilha e o Apps Script

1. Faça uma cópia de segurança da planilha antes de testar qualquer gravação.
2. Abra a planilha correta e confira os nomes das três abas: `CADASTRO`, `HISTÓRICO` e `TRANSPORTADOR`. Não renomeie as abas para nomes diferentes sem ajustar o código.
3. Na planilha, abra **Extensões → Apps Script**. Use o projeto associado a essa planilha para preservar permissões e arquivos que já existem.
4. No editor do Apps Script, abra `Code.gs`. Copie o conteúdo de `backend-apps-script/Code.gs` deste pacote e substitua o conteúdo de `Code.gs` existente. Salve.
5. **Preserve o arquivo `Index.html` e quaisquer outros arquivos existentes no projeto.** O `doGet()` do backend mantém a interface antiga disponível; o frontend Next.js é uma aplicação separada.
6. No Apps Script, abra **Configurações do projeto → Propriedades do script** e crie estas propriedades:
   - `FRETES_SPREADSHEET_ID` = ID da planilha Google Sheets correta.
   - `FRETES_API_TOKEN` = segredo forte e aleatório.
7. Para localizar o ID da planilha, copie a parte da URL entre `/d/` e `/edit`. Não coloque a URL completa no campo do ID.
8. Gere um token localmente no terminal, sem enviá-lo por mensagem. Com Node.js instalado, execute:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   Copie o resultado para a propriedade `FRETES_API_TOKEN`. Guarde-o em um gerenciador de senhas; não o coloque em arquivos públicos nem em código de frontend.
9. No editor, selecione a função `configurarPlanilhaFretes` e clique em **Executar**, se essa função estiver presente na versão do código. Autorize as permissões solicitadas. Se a função não aparecer, confirme que o `Code.gs` foi substituído integralmente e salvo. O backend também lê o ID configurado na propriedade do script.
10. Clique em **Implantar → Nova implantação**. Selecione **Aplicativo da Web**.
11. Configure **Executar como: Eu**. Para acesso, escolha a opção mais restrita que funcione para a organização. Se a hospedagem externa precisar chamar a API sem sessão Google, pode ser necessário permitir acesso público; nesse cenário, o token é obrigatório e deve permanecer apenas no servidor. Siga as políticas de segurança da sua organização.
12. Clique em **Implantar**, conceda as autorizações e copie a URL que termina em `/exec`. Essa é a URL da implantação, não a URL do editor.
13. Sempre que atualizar o código do Apps Script depois da primeira implantação, crie uma nova versão em **Implantar → Gerenciar implantações → Editar → Nova versão → Implantar**. Se a URL mudar, atualize a variável no host.

## Parte 2 — Testar o frontend no computador

1. Extraia `Central_Gestao_Fretes_V0_PONTE_API.zip` para uma pasta local, por exemplo `C:\CentralGestaoFretes`.
2. Abra um terminal nessa pasta. Verifique os arquivos: deve haver `package.json`, a pasta `app` e a pasta `backend-apps-script`.
3. Instale as dependências executando `npm install`. A instalação exige acesso à internet e pode levar alguns minutos.
4. Crie um arquivo `.env.local` na raiz (não edite `.env.example`) com este conteúdo, substituindo os valores:

   ```env
   FRETES_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID_DE_IMPLANTACAO/exec
   FRETES_API_TOKEN=COLE_AQUI_O_MESMO_TOKEN_DAS_PROPRIEDADES_DO_SCRIPT
   ```

5. O token precisa ser exatamente o mesmo configurado em `FRETES_API_TOKEN` no Apps Script. Não use o prefixo `NEXT_PUBLIC_`.
6. Execute `npm run dev` e abra `http://localhost:3000` no navegador.
7. Se aparecer “Integração ainda não configurada”, confira o nome e o local do `.env.local` e reinicie o servidor.
8. Se aparecer erro de JSON/permissão, confirme a URL `/exec`, a implantação do tipo Aplicativo da Web, o acesso autorizado e o token igual nos dois lados.
9. Rode `npm run build` antes de publicar. A instalação e o build não foram confirmados neste ambiente de preparação, então precisam ser executados no seu computador ou no host.

## Parte 3 — Publicar no GitHub privado e Vercel

1. Crie um repositório **privado** no GitHub. Não inclua `.env.local`, tokens ou senhas.
2. Envie os arquivos do projeto para o repositório. Confirme que `.env.local` está ignorado pelo `.gitignore`.
3. Entre em `https://vercel.com/`, conecte sua conta GitHub e importe o repositório privado.
4. Use as configurações padrão para Next.js. A Vercel detecta o framework automaticamente.
5. Antes de publicar, em **Settings → Environment Variables**, adicione:
   - `FRETES_APPS_SCRIPT_URL` = URL `/exec` da implantação do Apps Script.
   - `FRETES_API_TOKEN` = o mesmo segredo do Apps Script.
   Adicione as variáveis aos ambientes necessários (Preview para homologação; Production somente após aprovação).
6. Faça o deploy de Preview primeiro. Abra a URL gerada e teste a aplicação.
7. Para cada alteração nas variáveis de ambiente, faça um novo deploy para que elas entrem em vigor.

## Parte 4 — Roteiro obrigatório de homologação

Faça estes testes usando uma cópia da planilha e registros de teste claramente identificados:

1. Dashboard carrega e informa a planilha correta.
2. Pesquisa exata por CODCLI retorna apenas o código exato; um código inexistente não seleciona um cliente parecido.
3. Pesquisa pela lupa retorna opções parciais por código, nome ou cidade para seleção manual.
4. Lista de transportadoras carrega a partir da aba `TRANSPORTADOR`.
5. Envie um lançamento de teste com um cliente existente e valores pequenos/identificáveis. Confirme a mensagem de sucesso somente depois da resposta da API.
6. Abra a aba `HISTÓRICO` e confirme que o registro foi gravado nas colunas corretas, incluindo `Tipo` na coluna N.
7. Antes e depois do teste, confira as fórmulas e resultados das colunas X:AB. A API foi projetada para gravar apenas A:W, mas isso precisa ser confirmado na planilha real.
8. Confirme que data de entrega vazia é aceita.
9. Teste filtros/paginação do histórico, detalhe do registro, consulta exata de NF/CODCLI e exportação CSV.
10. Teste token inválido e URL errada: a interface deve exibir erro, nunca uma mensagem falsa de sucesso nem dados fictícios.
11. Exclua os registros de teste somente depois de confirmar que não afetará dados reais; prefira fazer toda a homologação numa cópia.

## Regras de segurança e limites conhecidos

- Nunca compartilhe o token, nem o inclua no frontend, GitHub ou `NEXT_PUBLIC_*`.
- Não publique em produção antes do build e dos testes de gravação.
- A data de coleta do formulário não tem coluna própria no contrato atual; não deve ser gravada em outra coluna como substituição.
- A integração desta versão ainda precisa de build completo e homologação com uma implantação real. Um ZIP íntegro não prova que a aplicação está operacional.
- Se a organização não permitir acesso externo ao Apps Script Web App, será necessário adotar um método de autenticação corporativa diferente; não contorne políticas de acesso.
