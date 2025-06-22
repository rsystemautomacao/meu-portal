# Meu Portal - Sistema de Gerenciamento de Times Esportivos

Um sistema completo para gerenciamento de times esportivos, desenvolvido com Next.js, TypeScript e Prisma.

## Funcionalidades

*   **Gerenciamento de Times:** Crie e gerencie times com cores personalizadas e logos.
*   **Gerenciamento de Jogadores:** Cadastre jogadores com fotos, números e informações detalhadas.
*   **Controle de Partidas:** Registre resultados de partidas e estatísticas dos jogadores.
*   **Gerenciamento Financeiro:** Controle de mensalidades, pagamentos e balanço financeiro.
*   **Progressive Web App (PWA):** Instale no seu celular e use offline.
*   **Deploy na Vercel:** Sistema totalmente funcional na nuvem.

## Tecnologias Utilizadas

*   **Frontend:** Next.js 13, React, TypeScript, Tailwind CSS
*   **Backend:** Next.js API Routes, Prisma ORM
*   **Banco de Dados:** MongoDB Atlas
*   **Autenticação:** NextAuth.js
*   **Deploy:** Vercel
*   **PWA:** next-pwa, Service Workers

## Como Usar

1.  Acesse o sistema através do link da Vercel
2.  Crie uma conta ou faça login
3.  Crie seu time e comece a gerenciar seus jogadores
4.  Instale como PWA no seu dispositivo móvel

## Status do Deploy

✅ Sistema funcionando na Vercel com MongoDB Atlas
✅ PWA configurado e funcional
✅ Todas as funcionalidades operacionais

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