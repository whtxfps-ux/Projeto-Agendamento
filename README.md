# Agenda

Sistema de agendamento online para profissionais autônomos, como manicures,
cabeleireiros e outros prestadores de serviços.

## Tecnologias

- [Next.js](https://nextjs.org/) com React e TypeScript
- [Supabase](https://supabase.com/) para autenticação e banco de dados PostgreSQL
- Tailwind CSS para estilos

## Requisitos

- Node.js (versão LTS recomendada)
- npm
- Um projeto no Supabase

## Como executar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` na raiz do projeto com as credenciais do seu
   projeto Supabase:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-publica
   ```

   Use a chave pública `anon`/`publishable`. Nunca coloque uma chave
   `service_role` ou secreta em uma variável `NEXT_PUBLIC_`. O arquivo
   `.env.local` é ignorado pelo Git e não deve ser enviado ao repositório.

3. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

4. Acesse [http://localhost:3000](http://localhost:3000). A página inicial
   direciona para o cadastro e login.

## Configuração do Supabase

### Banco de dados

A migração inicial está em
`supabase/migrations/20261031000000_initial_booking_schema.sql`. Execute-a
uma única vez no SQL Editor do seu projeto Supabase. Ela cria as tabelas de
negócios, serviços, horários e agendamentos, além das políticas de segurança
por linha (RLS) e da função pública para criar reservas sem sobreposição de
horários.

### Confirmação de e-mail

O cadastro usa a confirmação de e-mail do Supabase. No painel do Supabase,
adicione os endereços de retorno em **Authentication → URL Configuration →
Redirect URLs**:

- `http://localhost:3000/auth/callback` para desenvolvimento local
- `http://127.0.0.1:3000/auth/callback` se acessar o servidor pelo endereço IP local
- `https://seu-dominio.com/auth/callback` quando publicar o sistema

O endereço de produção deve usar o domínio real do projeto.

### Segurança e proteção de dados

Em **Authentication → Sign In / Providers → User signups**, mantenha
**Confirm email** habilitado para impedir que endereços não verificados
acessem as contas. O link de confirmação retorna para `/auth/callback`; por
isso, configure as URLs de retorno indicadas acima.

Em **Authentication → Sign In / Providers → Password**, configure:

- Comprimento mínimo: 8 caracteres
- Requisitos: letras minúsculas e maiúsculas, números e símbolos

#### Senhas

As senhas são enviadas ao Supabase Auth por conexão HTTPS. O Supabase as
armazena usando bcrypt com salt; a aplicação não salva senhas nem cria hashes
próprios. A senha não é incluída nos logs da aplicação.

No cadastro, são exigidos pelo menos 8 caracteres, uma letra maiúscula, uma
minúscula, um número e um símbolo aceito pelo Supabase. O limite de 72 bytes
evita incompatibilidade com o limite do bcrypt. A senha de login é verificada
pelo Supabase Auth.

#### Validação do cadastro

O nome completo deve conter ao menos duas partes e ter de 5 a 100 caracteres;
o e-mail é validado e normalizado para minúsculas. Essas regras são aplicadas
no formulário e novamente na Server Action, para que não dependam apenas do
navegador.

A migração
`supabase/migrations/20261031000001_professional_signup_validation.sql`
cria uma validação adicional de nome para o hook **Before User Created**.
Execute-a no SQL Editor e selecione a função em **Authentication → Hooks →
Before User Created**. Com o hook habilitado, a regra também é aplicada a
cadastros feitos diretamente pela API do Supabase.

O Supabase Auth aplica limites de requisições e de envio de e-mails. No plano
e configuração padrão, esses limites podem restringir testes frequentes; usar
SMTP personalizado pode aumentar a cota de envio de e-mails, mas não remove
os limites de requisições do Auth.

#### Credenciais, banco e limites

- Use somente a chave pública `anon`/`publishable` no navegador. Nunca exponha
  `service_role`, chaves secretas ou credenciais SMTP no cliente, no Git ou em
  variáveis `NEXT_PUBLIC_`.
- Mantenha `.env.local` fora do controle de versão. Em produção, configure os
  segredos no ambiente seguro do serviço de hospedagem.
- As tabelas da migração inicial usam políticas RLS; revise e teste as
  políticas antes de disponibilizar novos dados ou operações.
- A validação de nome e e-mail reduz entradas inválidas, mas não comprova a
  identidade do profissional nem impede toda conta fictícia. A confirmação
  verifica acesso ao e-mail, não a identidade civil.
- A confirmação de e-mail e essas medidas técnicas não garantem, sozinhas,
  conformidade com a LGPD. Antes de disponibilizar o sistema ao público,
  publique uma política de privacidade com controlador, finalidade e base
  legal, retenção, contato e instruções para exercício dos direitos dos
  titulares.

## Autenticação disponível

- Cadastro com nome, e-mail e senha
- Login com e-mail e senha
- Confirmação de cadastro por e-mail
- Painel protegido, acessível apenas após login
- Encerramento de sessão

## Comandos úteis

```bash
npm run dev    # inicia o servidor local
npm run lint   # executa o ESLint
npm run build  # valida e gera a versão de produção
npm run start  # inicia a versão de produção já compilada
```

## Próximas etapas

O painel inicial de autenticação está implementado. As próximas etapas do
produto incluem cadastrar o negócio, configurar serviços e horários e
disponibilizar a página pública de agendamentos.

## Documentação

- [Documentação do Next.js](https://nextjs.org/docs)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Tailwind CSS](https://tailwindcss.com/docs)
