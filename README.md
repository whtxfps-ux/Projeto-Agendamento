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

### Políticas de autenticação

Em **Authentication → Sign In / Providers → User signups**, mantenha
**Confirm email** habilitado para impedir que endereços não verificados
acessem as contas.

Em **Authentication → Sign In / Providers → Password**, configure:

- Comprimento mínimo: 8 caracteres
- Requisitos: letras minúsculas e maiúsculas, números e símbolos

O Supabase Auth armazena senhas usando hashes bcrypt com salt aleatório. O
aplicativo não cria nem armazena hashes de senha por conta própria.

A migração
`supabase/migrations/20261031000001_professional_signup_validation.sql`
adiciona a validação do nome no hook **Before User Created**. Depois de
executar a migração no SQL Editor, selecione essa função em **Authentication →
Hooks → Before User Created**. A validação do formulário também ocorre no
servidor, e o hook aplica a mesma regra a cadastros feitos diretamente pela
API do Supabase.

Validações de formato ajudam a reduzir cadastros inválidos, mas não comprovam
a identidade de uma pessoa. A confirmação de e-mail é necessária para isso;
regras de nome não conseguem identificar todos os nomes fictícios.

Antes de disponibilizar o sistema ao público, publique uma política de
privacidade com a identificação do controlador, finalidade e base legal para
o uso dos dados, período de retenção, contato e instruções para exercer os
direitos previstos na LGPD. Essas medidas técnicas não constituem, por si só,
uma garantia de conformidade legal.

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
