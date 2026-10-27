# Central de Gestão de Fretes — ponte de integração v0 + Apps Script

## O que este pacote entrega
- Mantém a interface Next.js original do v0 como base.
- Adiciona um endpoint server-side `/api/fretes/[action]` para que o navegador não chame o Apps Script diretamente (evita depender de CORS no browser).
- Adiciona `doPost` ao backend para encaminhar ações permitidas para as funções já existentes.
- O segredo fica no servidor Next.js e em Script Properties; não deve ser exposto no frontend.

## Antes de usar
Esta é uma base de integração; não está conectada à sua conta Google até que a implantação e as variáveis sejam configuradas. Não publique como produção antes de testar com uma linha controlada.

## Configuração do Apps Script
1. Faça uma cópia de segurança do projeto Apps Script atual.
2. Copie o `backend-apps-script/Code.gs` para o editor, preservando a configuração de planilha que já usa.
3. Em **Configurações do projeto > Propriedades do script**, crie `FRETES_API_TOKEN` com um segredo longo e aleatório. Use exatamente o mesmo valor no servidor Next.js.
4. Implante como **Aplicativo da Web**, executar como proprietário. O acesso deve ser o mínimo permitido pela sua política; a proteção por token é adicional, não substitui revisão de permissões.
5. Copie a URL `/exec` da implantação.

## Configuração do frontend
1. Copie `.env.example` para `.env.local` em desenvolvimento (ou configure as mesmas variáveis no provedor de hospedagem).
2. Defina `FRETES_APPS_SCRIPT_URL` como a URL `/exec` da implantação.
3. Defina `FRETES_API_TOKEN` com o mesmo segredo salvo nas propriedades do Apps Script.
4. Rode `npm install` e `npm run dev` para desenvolvimento; para publicação, use `npm run build` e a hospedagem Node/Next compatível.

## Ações de API suportadas pela ponte
`initial`, `dashboard`, `searchClients`, `getClientByCode`, `searchCarriers`, `history`, `historyDetail`, `submitFreight`.

## Atenção: estado atual
Nesta revisão, Dashboard e Histórico já consomem as ações `initial`, `history` e `historyDetail` pela API. O lançamento e a pesquisa de clientes/transportadoras também estão ligados ao contrato do backend. Clientes, Transportadoras, Consultas, Análises e Relatórios ainda precisam de migração; a integração não foi testada contra uma implantação Google real. Não publicar como produção antes de configurar URL/token e validar os fluxos com um registro controlado.
