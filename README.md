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
✅ Schema corrigido e compatível com MongoDB

## Pré-requisitos

*   Node.js 18 ou superior
*   npm ou yarn
*   MongoDB Atlas (banco de dados na nuvem)

## Instalação

1.  Clone o repositório:
    ```bash
    git clone https://github.com/rsystemautomacao/meu-portal.git
    cd meu-portal
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

3.  Configure as variáveis de ambiente:
    ```bash
    cp .env.example .env.local
    ```
    Edite o arquivo `.env.local` com suas configurações.

4.  Execute as migrações do banco de dados:
    ```bash
    npx prisma db push
    ```

5.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

6.  Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## Scripts Disponíveis

*   `npm run dev` - Inicia o servidor de desenvolvimento
*   `npm run build` - Gera a build de produção
*   `npm run start` - Inicia o servidor de produção
*   `npm run lint` - Executa o linter

## Estrutura do Projeto

```
src/
├── app/                 # App Router do Next.js 13
│   ├── api/            # Rotas da API
│   ├── auth/           # Páginas de autenticação
│   ├── dashboard/      # Dashboard principal
│   └── ...
├── components/         # Componentes React
├── lib/               # Utilitários e configurações
└── types/             # Definições de tipos TypeScript
```

## Contribuição

1.  Faça um fork do projeto
2.  Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3.  Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4.  Push para a branch (`git push origin feature/AmazingFeature`)
5.  Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 