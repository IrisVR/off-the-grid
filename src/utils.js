const fs = require('fs-extra');

const appendFile = (path, data) =>
  fs.appendFile(path, `${data}\n`, { encoding: 'utf8' });

const readFileSize = path =>
  fs.stat(path).then(stat => stat.size);

const readFile = path =>
  fs.readFile(path, { encoding: 'utf8' });

const deleteFile = path =>
  fs.remove(path);

const copyFile = (source, target) =>
  fs.copy(source, target);

module.exports = {
  appendFile,
  readFile,
  readFileSize,
  deleteFile,
  copyFile
};
