const fs = require('fs');
const fsExtra = require('fs-extra');

const appendFile = (path, data) => {
  return new Promise((resolve, reject) => {
    fs.appendFile(path, `${data}\n`, { encoding: 'utf8' }, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};

const readFileSize = (path) => {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) return reject(err);
      return resolve(stat.size);
    });
  });
};

const readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: 'utf8' }, (err, data) => {
      if (err) return reject(err);
      return resolve(data);
    });
  });
};

const deleteFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};

const copyFile = (source, target) =>
  fsExtra.copy(source, target);

module.exports = {
  appendFile,
  readFile,
  readFileSize,
  deleteFile,
  copyFile
};
