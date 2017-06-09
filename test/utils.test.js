const fs = require("fs");
const chai = require("chai");
const mock = require("mock-fs");
const expect = chai.expect;
const utils = require("../src/utils");

const mockDir = "./_mock";

describe("utils", () => {
  afterEach(() => {
    mock.restore();
  });

  it("should read a file", () => {
    mock({
      [mockDir]: {
        "file.txt": "This is a file"
      }
    });

    return utils.readFile(`${mockDir}/file.txt`)
      .then((data) => expect(data).equal("This is a file"));
  });

  it("should read a file size", () => {
    mock({
      [mockDir]: {
        "file.txt": "This is a file"
      }
    });

    return utils.readFileSize(`${mockDir}/file.txt`)
      .then((size) => {
        expect(size).equal(14);
      });
  });

  it("should append a file", () => {
    mock({
      [mockDir]: {}
    });

    return utils.appendFile(`${mockDir}/file.txt`, "Hello")
      .then(() => utils.appendFile(`${mockDir}/file.txt`, "Christian Sakai"))
      .then(() => utils.readFile(`${mockDir}/file.txt`))
      .then((data) => expect(data).equal("Hello\nChristian Sakai\n"));
  });

  it("should delete a file", () => {
    mock({
      [mockDir]: {
        "file.txt": "This is a file"
      }
    });

    const path = `${mockDir}/file.txt`;

    return utils.deleteFile(path)
      .then(() => utils.readFile(path))
      .catch((err) => {
        expect(err.message).to.equal(`ENOENT, no such file or directory '${path}'`);
      });
  });

  it("should copy from one file to another", () => {
    mock({
      [mockDir]: {
        "file.txt": "This is a file"
      }
    });

    const source = `${mockDir}/file.txt`;
    const target = `${mockDir}/file-new.txt`;

    return utils.copyFile(source, target)
      .then(() => utils.readFile(target))
      .then((data) => expect(data).to.equal("This is a file"));
  });
});
