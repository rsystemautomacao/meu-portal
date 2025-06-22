# Meu Portal

Um aplicativo web progressivo (PWA) para gerenciamento de times esportivos.

## Funcionalidades

- Autenticação de usuários
- Gerenciamento de times
- Cadastro e gerenciamento de jogadores
- Registro de partidas e estatísticas
- Controle financeiro
- Suporte offline
- Interface responsiva

## Tecnologias Utilizadas

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (ORM)
- NextAuth.js
- SQLite (Banco de dados)
- PWA (Progressive Web App)

## Pré-requisitos

- Node.js 16.8 ou superior
- npm ou yarn

## Instalação

1. Clone o repositório:
```bash
git clone https://seu-repositorio/meu-portal.git
cd meu-portal
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```
Edite o arquivo `.env` com suas configurações.

4. Execute as migrações do banco de dados:
```bash
npx prisma migrate dev
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3000`.

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a versão de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa a verificação de linting

## Estrutura do Projeto

```
src/
  ├── app/              # Rotas e páginas
  ├── components/       # Componentes React
  ├── lib/             # Utilitários e configurações
  ├── styles/          # Estilos globais
  └── types/           # Definições de tipos TypeScript
prisma/
  └── schema.prisma    # Schema do banco de dados
public/               # Arquivos estáticos
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

*   **Gerenciamento Financeiro:** Controle de mensalidades, pagamentos e balanço financeiro.
*   **Progressive Web App (PWA):** Instale no seu celular e use offline. 