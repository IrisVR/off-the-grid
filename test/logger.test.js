const chai = require("chai");
const mock = require("mock-fs");
const faker = require("faker");
const expect = chai.expect;
const utils = require("../src/utils");
const Logger = require("../src/logger");

const mockDir = "./_mock";
const mockLogfile = "_mock.log";
let logger;

function generatePerson() {
  return {
    name: faker.internet.userName(),
    email: faker.internet.email(),
  }
}

function generateFakeData() {
  const neighbors = [];
  for (var i = 0; i < 100; i++) {
    neighbors.push(generatePerson());
  }

  return {
    message: faker.lorem.text(),
    body: {
      name: faker.internet.userName(),
      email: faker.internet.email(),
      neighbors: neighbors
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

    return logger.log(fakeData)
      .then(() => utils.readFile(`${mockDir}/${mockLogfile}`))
      .then(parse)
      .then((result) => {
        expect(result[0].data).to.deep.equal(fakeData);
        expect(result[0].timestamp).to.exist;
      });
  });

  it("should flush from a log file", () => {
    let dataArr = [];
    for (let i = 0; i < 4; i++) {
      dataArr.push(generateFakeData());
    }

    dataLogPromises = dataArr.map((data) => 
      logger.log(data)
    );

    return Promise.all(dataLogPromises)
      .then(() => logger.flush())
      .then((result) => parse(result))
      .then((result) => {
        for (let i = 0; i < result.length; i++) {
          expect(result[i].data).to.deep.equal(dataArr[i]);
          expect(result[i].timestamp).to.exist;
        }
      });
  });

  it("should not throw error when flushing from an empty file", () => {
    return logger.flush()
      .then(parse)
      .then((data) => expect(data.length).to.equal(0));
  });

  it("should not have race conditions when writing and flushing", function(done) {
    let doneCounter = 0;

    function looseWriteAndFlush(amount) {
      let dataArr = [];
      for (let i = 0; i < amount; i++)
        dataArr.push(generateFakeData());

      dataLogPromises = dataArr.map((data) => 
        logger.log(data)
      );

      logger.flush()
        .then((result) => parse(result))
        .then((result) => {
          for (let i = 0; i < result.length; i++) {
            expect(result[i].data).to.deep.equal(dataArr[i]);
            expect(result[i].timestamp).to.exist;
          }

          doneCounter++;
        });
    }

    const stressTest = [
      looseWriteAndFlush(10),
      looseWriteAndFlush(30),
      looseWriteAndFlush(50),
      looseWriteAndFlush(13),
      looseWriteAndFlush(70)
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
