const chai = require("chai");
const mock = require("mock-fs");
const faker = require("faker");
const expect = chai.expect;
const utils = require("../src/utils");
const Logger = require("../src/logger");

const mockDir = "./_mock";
const mockLogfile = "_mock.log";
let logger;

function generateFakeData() {
  return {
    message: faker.lorem.text(),
    body: {
      name: faker.internet.userName(),
      email: faker.internet.email()
    }
  };
}

function parse(data) {
  if (data !== "") {
    return data.split("\n")
      .filter((line) => "" !== line)
      .map((line) => JSON.parse(line));
  } else {
    return [];
  }
}

describe("Logger", () => {
  beforeEach(() => {
    mock({
      [mockDir]: {}
    });

    logger = new Logger(`${mockDir}/${mockLogfile}`);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should write to a log file", () => {
    const fakeData = generateFakeData();

    logger.write(fakeData.message, fakeData.body)
      .then(() => utils.readFile(`${mockDir}/${mockLogfile}`))
      .then((data) => {
        expect(data.message).to.equal(fakeData.message);
        expect(data.body).to.deep.equal(fakeData.body);
      });
  });

  it("should write to a log file in order", () => {
    let dataArr = [];
    for (let i = 0; i < 5; i++) {
      dataArr.push(generateFakeData());
    }

    dataLogPromises = dataArr.map((data) => 
      logger.write(data.message, data.body)
    );

    return Promise.all(dataLogPromises)
      .then(() => utils.readFile(`${mockDir}/${mockLogfile}`))
      .then((data) => {
        data = parse(data);

        for (let i = 0; i < data.length; i++) {
          expect(data[i].message).to.equal(dataArr[i].message);
          expect(data[i].body).to.deep.equal(dataArr[i].body);
        }
      });
  });

  it("should flush from a log file", () => {
    let dataArr = [];
    for (let i = 0; i < 4; i++) {
      dataArr.push(generateFakeData());
    }

    dataLogPromises = dataArr.map((data) => 
      logger.write(data.message, data.body)
    );

    return Promise.all(dataLogPromises)
    .then(() => logger.flush())
    .then((data) => parse(data))
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        expect(data[i].message).to.equal(dataArr[i].message);
        expect(data[i].body).to.deep.equal(dataArr[i].body);
      }
    });
  });

  it("should not throw error when flushing from an empty file", () => {
    return logger.flush()
      .then((data) => parse(data))
      .then((data) => expect(data.length).to.equal(0));
  });

  it.only("should not have race conditions when writing and flushing", (done) => {
    let doneCounter = 0;
    const dataOne = generateFakeData();
    const dataTwo = generateFakeData();

    logger.write(dataOne.message, dataOne.body, "One");
    logger.flush()
      .then((data) => parse(data))
      .then((data) => {
        expect(data[0].message).to.equal(dataOne.message);
        expect(data[0].body).to.deep.equal(dataOne.body);

        doneCounter++;
      });

    logger.write(dataTwo.message, dataTwo.body, "Two");
    logger.flush()
      .then((data) => parse(data))
      .then((data) => {
        expect(data[0].message).to.equal(dataTwo.message);
        expect(data[0].body).to.deep.equal(dataTwo.body);

        doneCounter++;
      });
    
    (function loop() {
      if (doneCounter === 2) {
        done();
      } else {
        setTimeout(loop, 0);
      }
    })();
  });

  it("should not have race conditions on stress test", (done) => {
    let doneCounter = 0;

    function looseWriteAndFlush(amount) {
      let dataArr = [];
      for (let i = 0; i < amount; i++)
        dataArr.push(generateFakeData());

      dataArr.map((data, i) => 
        logger.write(data.message, data.body, i)
      );

      logger.flush()
        .then((data) => parse(data))
        .then((data) => {
          for (let i = 0; i < data.length; i++) {
            expect(data[i].message).to.equal(dataArr[i].message);
            expect(data[i].body).to.deep.equal(dataArr[i].body);
          }

          doneCounter++;
        });
    }

    const stressTest = [
      looseWriteAndFlush(1),
      looseWriteAndFlush(1),
      // looseWriteAndFlush(50),
      // looseWriteAndFlush(13),
      // looseWriteAndFlush(7)
    ];

    (function loop() {
      if (doneCounter === stressTest.length) {
        done();
      } else {
        setTimeout(loop, 0);
      }
    })();
  });
});
