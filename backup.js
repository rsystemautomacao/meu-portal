const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

// Diretório de origem (projeto atual)
const sourceDir = __dirname;
// Diretório de destino (backup)
const backupDir = 'C:/Users/richa/Desktop/Programas cursor/Meu Portal Backup';

// Lista de pastas/arquivos a ignorar
const ignoreList = ['node_modules', '.next', 'out', 'temp', 'backup.js', 'backup-script.ps1'];

function shouldIgnore(filePath) {
  return ignoreList.some((ignore) => filePath.includes(path.sep + ignore));
}

async function copyDir(src, dest) {
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  await fse.ensureDir(dest);

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (shouldIgnore(srcPath)) continue;
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fse.copy(srcPath, destPath);
    }
  }
}

(async () => {
  try {
    await copyDir(sourceDir, backupDir);
    console.log('Backup concluído com sucesso!');
  } catch (err) {
    console.error('Erro ao fazer backup:', err);
  }
})(); 