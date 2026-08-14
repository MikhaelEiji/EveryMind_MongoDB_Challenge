# EveryMind MongoDB Challenge

Aplicação Node.js, Express, EJS e MongoDB preparada para execução local e publicação no Render.

## Executar localmente

1. Copie `.env.example` para `.env` e substitua os valores.
2. No MongoDB Atlas, autorize o seu IP em **Network Access**.
3. Execute:

```powershell
npm install
npm run start:local
```

A aplicação ficará disponível em `http://localhost:3000`.

## Publicar no Render

1. Envie o projeto para um repositório GitHub. Nunca envie o arquivo `.env` nem a pasta `node_modules`.
2. No Render, escolha **New > Blueprint** e conecte o repositório. O arquivo `render.yaml` preenche o build e o comando de inicialização.
3. Informe `MONGODB_URI` com a URI completa do usuário `everymind_app`. O banco da URI deve ser `EveryMind`.
4. `SESSION_SECRET` é gerado automaticamente pelo Blueprint. Se criar o serviço manualmente, gere uma chave longa e aleatória e cadastre-a como variável secreta.
5. No Atlas, em **Network Access**, autorize o acesso do Render. Para começar rapidamente pode ser `0.0.0.0/0`; mantenha usuário e senha exclusivos e permissões somente no banco `EveryMind`.
6. Faça o deploy e valide `/`, `/login`, criação de conta, login e envio de currículo.

Configuração manual equivalente no Render:

- Runtime: `Node`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/health`
- Variáveis: `NODE_ENV=production`, `MONGODB_URI` e `SESSION_SECRET`

## Segurança

- A URI real do MongoDB fica apenas no `.env` local e nas variáveis secretas do Render.
- Sessões são persistidas no MongoDB e o cookie é seguro em produção.
- Formulários têm proteção CSRF e o login possui limite de tentativas.
- Currículos aceitam apenas PDF de até 5 MB e só podem ser acessados pelo candidato, recrutador responsável ou administrador.
