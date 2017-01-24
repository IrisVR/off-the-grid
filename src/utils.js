const fs = require("fs");

const readFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path, { encoding: "utf-8" }, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
};

const deleteFile = (path) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

const copyFile = (source, target) => {
  return new Promise((resolve, reject) => {
    // So doesn't throw error when there's no
    // source file
    // fs.openSync(source, "w");

    let callbackCalled = false;

    const read = fs.createReadStream(source);
    read.on("error", (err) => done(err));

    const write = fs.createWriteStream(target);
    write.on("error", (err) => done(err));
    write.on("close", (_) => done());

    read.pipe(write);

    function done(err) {
      if (!callbackCalled) {
        if (err) {
          reject(err);
        } else {
          resolve(err);
        }
        callbackCalled = true;
      }
    }
  });
};

module.exports = {
  readFile,
  deleteFile,
  copyFile
};
