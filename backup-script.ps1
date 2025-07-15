# Script de Backup do Projeto "Meu Portal"
# Data: $(Get-Date -Format "yyyy-MM-dd_HH-mm-ss")

# Definir variáveis
$projectName = "Meu-Portal"
$backupDate = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFolder = "backup_${projectName}_${backupDate}"
$currentDir = Get-Location

Write-Host "=== INICIANDO BACKUP DO PROJETO ===" -ForegroundColor Green
Write-Host "Projeto: $projectName" -ForegroundColor Yellow
Write-Host "Data: $backupDate" -ForegroundColor Yellow
Write-Host "Pasta de backup: $backupFolder" -ForegroundColor Yellow

# Criar pasta de backup
New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null
Write-Host "✓ Pasta de backup criada" -ForegroundColor Green

# Lista de arquivos e pastas para backup
$itemsToBackup = @(
    "src",
    "prisma",
    "public",
    "package.json",
    "package-lock.json",
    "next.config.js",
    "tailwind.config.js",
    "postcss.config.js",
    "tsconfig.json",
    "next-env.d.ts",
    ".npmrc",
    "README.md",
    "PWA_README.md",
    "LICENSE",
    ".gitignore",
    "generate-icons.html"
)

# Copiar arquivos e pastas
foreach ($item in $itemsToBackup) {
    if (Test-Path $item) {
        if (Test-Path $item -PathType Container) {
            # É uma pasta
            Copy-Item -Path $item -Destination "$backupFolder/$item" -Recurse -Force
            Write-Host "✓ Pasta copiada: $item" -ForegroundColor Green
        } else {
            # É um arquivo
            Copy-Item -Path $item -Destination "$backupFolder/$item" -Force
            Write-Host "✓ Arquivo copiado: $item" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠ Item não encontrado: $item" -ForegroundColor Yellow
    }
}

# Criar arquivo de informações do backup
$backupInfo = @"
=== BACKUP DO PROJETO "MEU PORTAL" ===
Data: $backupDate
Versão do Node.js: $(node --version)
Versão do npm: $(npm --version)

ARQUIVOS INCLUÍDOS NO BACKUP:
$(Get-ChildItem -Path $backupFolder -Recurse | ForEach-Object { $_.FullName.Replace($backupFolder, "") })

INSTRUÇÕES PARA RESTAURAÇÃO:
1. Copie todos os arquivos da pasta de backup para uma nova pasta
2. Execute: npm install
3. Execute: npx prisma generate
4. Configure as variáveis de ambiente (.env)
5. Execute: npm run dev

VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
"@

$backupInfo | Out-File -FilePath "$backupFolder/BACKUP_INFO.txt" -Encoding UTF8
Write-Host "✓ Arquivo de informações criado" -ForegroundColor Green

# Criar arquivo .env de exemplo
$envExample = @"
# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Vercel (para produção)
# NEXTAUTH_URL="https://your-app.vercel.app"
"@

$envExample | Out-File -FilePath "$backupFolder/.env.example" -Encoding UTF8
Write-Host "✓ Arquivo .env.example criado" -ForegroundColor Green

# Criar arquivo de status do Git
if (Test-Path ".git") {
    $gitStatus = git status --porcelain
    $gitBranch = git branch --show-current
    $gitCommit = git rev-parse HEAD
    
    $gitInfo = @"
=== INFORMAÇÕES DO GIT ===
Branch atual: $gitBranch
Commit atual: $gitCommit
Status: $gitStatus
"@
    
    $gitInfo | Out-File -FilePath "$backupFolder/GIT_INFO.txt" -Encoding UTF8
    Write-Host "✓ Informações do Git salvas" -ForegroundColor Green
}

# Criar arquivo de dependências
npm list --depth=0 > "$backupFolder/dependencies.txt" 2>$null
Write-Host "✓ Lista de dependências salva" -ForegroundColor Green

# Comprimir o backup (opcional)
Write-Host "`n=== RESUMO DO BACKUP ===" -ForegroundColor Cyan
Write-Host "Pasta de backup: $backupFolder" -ForegroundColor Yellow
Write-Host "Localização: $currentDir\$backupFolder" -ForegroundColor Yellow

$backupSize = (Get-ChildItem -Path $backupFolder -Recurse | Measure-Object -Property Length -Sum).Sum
$backupSizeMB = [math]::Round($backupSize / 1MB, 2)
Write-Host "Tamanho do backup: $backupSizeMB MB" -ForegroundColor Yellow

Write-Host "`n✓ BACKUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "Você pode copiar a pasta '$backupFolder' para um local seguro." -ForegroundColor Cyan 