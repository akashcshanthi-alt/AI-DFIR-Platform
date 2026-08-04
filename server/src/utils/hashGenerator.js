const crypto = require('crypto');
const fs = require('fs');

/**
 * Calculates MD5, SHA1, and SHA256 checksum hashes for a file.
 * Stream-based implementation ensures low memory usage for large files.
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<Object>} Object containing md5, sha1, and sha256 hex strings
 */
const calculateHashes = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const md5 = crypto.createHash('md5');
      const sha1 = crypto.createHash('sha1');
      const sha256 = crypto.createHash('sha256');

      const stream = fs.createReadStream(filePath);

      stream.on('data', (data) => {
        md5.update(data);
        sha1.update(data);
        sha256.update(data);
      });

      stream.on('end', () => {
        resolve({
          md5: md5.digest('hex'),
          sha1: sha1.digest('hex'),
          sha256: sha256.digest('hex')
        });
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  calculateHashes
};
