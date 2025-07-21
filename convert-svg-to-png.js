const sharp = require('sharp');
const fs = require('fs');

const input = 'public/icons/icon.svg';
const output = 'public/icons/icon-192x192.png';

sharp(input)
  .resize(192, 192)
  .png()
  .toFile(output)
  .then(() => {
    console.log('✅ PNG gerado com sucesso:', output);
  })
  .catch(err => {
    console.error('❌ Erro ao converter SVG para PNG:', err);
  }); 