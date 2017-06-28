const fs = require('fs');
// fs-extra v.0.30.0
// to be compatible with Prospect Launcher
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

const copyFile = (source, target) => {
  return new Promise((resolve, reject) => {
    fsExtra.copy(source, target, (err) => {
      if (err) return reject(err);
      return resolve();
    });
  });
};

module.exports = {
  appendFile,
  readFile,
  readFileSize,
  deleteFile,
  copyFile
};
