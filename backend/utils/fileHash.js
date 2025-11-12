const crypto = require('crypto');
const fs = require('fs');

/**
 * Calcula el hash SHA256 de un archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<string>} Hash del archivo
 */
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Calcula el hash MD5 de un archivo (más rápido, menos seguro)
 * @param {string} filePath - Ruta del archivo
 * @returns {Promise<string>} Hash del archivo
 */
function calculateFileMD5(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

module.exports = {
  calculateFileHash,
  calculateFileMD5
};
