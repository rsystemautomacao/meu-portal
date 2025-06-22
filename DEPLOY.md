# Guia de Deploy - GitHub Pages

Este guia explica como fazer o deploy do projeto "Meu Portal" no GitHub Pages.

## Pré-requisitos

1. Ter uma conta no GitHub
2. Ter o projeto no GitHub (repositório público ou privado)
3. Ter permissões de administrador no repositório

## Passo a Passo

### 1. Preparar o Repositório

1. Crie um novo repositório no GitHub chamado `meu-portal`
2. Faça push do código para o repositório:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/meu-portal.git
   git push -u origin main
   ```

### 2. Configurar GitHub Pages

1. Vá para o repositório no GitHub
2. Clique em "Settings" (Configurações)
3. Role para baixo até "Pages"
4. Em "Source", selecione "Deploy from a branch"
5. Em "Branch", selecione "gh-pages" e "/(root)"
6. Clique em "Save"

### 3. Configurar GitHub Actions

O workflow já está configurado em `.github/workflows/deploy.yml`. Ele irá:
- Fazer build do projeto automaticamente
- Fazer deploy para a branch `gh-pages`
- Atualizar o site sempre que houver push na branch `main`

### 4. Primeiro Deploy

1. Faça push de qualquer mudança para a branch `main`:
   ```bash
   git add .
   git commit -m "Setup for GitHub Pages"
   git push
   ```

2. Vá para a aba "Actions" no GitHub
3. Aguarde o workflow "Deploy to GitHub Pages" completar
4. O site estará disponível em: `https://SEU_USUARIO.github.io/meu-portal/`

## Configurações Importantes

### Base Path
O projeto está configurado para funcionar com o base path `/meu-portal/` em produção.

### PWA
O PWA funcionará corretamente no GitHub Pages com:
- Service Worker
- Manifest.json
- Ícones em múltiplos tamanhos
- Funcionalidades offline

### Banco de Dados
⚠️ **IMPORTANTE**: O projeto usa Prisma com banco de dados. Para funcionar no GitHub Pages, você precisará:
1. Configurar um banco de dados online (ex: PlanetScale, Railway, etc.)
2. Atualizar as variáveis de ambiente no GitHub Actions
3. Ou usar uma solução serverless para as APIs

## Solução para APIs

Como o GitHub Pages é estático, as APIs não funcionarão. Opções:

1. **Vercel** (Recomendado):
   - Deploy gratuito
   - Suporte completo ao Next.js
   - APIs funcionam perfeitamente

2. **Netlify**:
   - Deploy gratuito
   - Suporte a funções serverless

3. **Railway/Render**:
   - Deploy com banco de dados
   - Mais robusto para produção

## URLs Finais

- **GitHub Pages**: `https://SEU_USUARIO.github.io/meu-portal/`
- **Vercel** (recomendado): `https://meu-portal.vercel.app/`

## Troubleshooting

### Erro 404
- Verifique se o basePath está configurado corretamente
- Certifique-se de que o arquivo `.nojekyll` existe

### PWA não funciona
- Verifique se o manifest.json está acessível
- Confirme se o service worker está registrado

### APIs não funcionam
- Use Vercel ou outra plataforma que suporte APIs
- GitHub Pages é apenas para sites estáticos 