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

  it("should write to a log file in order", () => {
    let dataArr = [];
    for (let i = 0; i < 5; i++) {
      dataArr.push(generateFakeData());
    }

    dataLogPromises = dataArr.map((data) => 
      logger.log(data)
    );

    return Promise.all(dataLogPromises)
      .then(() => utils.readFile(`${mockDir}/${mockLogfile}`))
      .then((result) => {
        result = parse(result);

        for (let i = 0; i < result.length; i++) {
          expect(result[i].data).to.deep.equal(dataArr[i]);
        }
      });
  });

  it("should not crash when writing potentially weird data to a log file", () => {
    const troublingData = "<1#@$%^&*)(div>foo</1#@$%^&*)(di1#@$%^&*)(v>";

    return logger.log(troublingData)
      .then(() => utils.readFile(`${mockDir}/${mockLogfile}`))
      .then((result) => {
        result = parse(result);

        for (let i = 0; i < result.length; i++) {
          expect(result[i].data).to.deep.equal(troublingData);
        }
      })
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

  it("should not have race conditions when writing and flushing", (done) => {
    let doneCounter = 0;
    const dataOne = generateFakeData();
    const dataTwo = generateFakeData();

    logger.log(dataOne, "One");
    logger.flush()
      .then((result) => parse(result))
      .then((result) => {
        expect(result[0].data).to.deep.equal(dataOne);

        doneCounter++;
      });

    logger.log(dataTwo, "Two");
    logger.flush()
      .then((result) => parse(result))
      .then((result) => {
        expect(result[0].data).to.deep.equal(dataTwo);

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

  it("should not have race conditions on stress test", function(done) {
    this.timeout(10000);

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
          expect(result.length).to.equal(amount);

          for (let i = 0; i < result.length; i++) {
            expect(result[i].data).to.deep.equal(dataArr[i]);
            expect(result[i].timestamp).to.exist;
          }

          doneCounter++;
        });
    }

    const stressTest = [
      looseWriteAndFlush(100),
      looseWriteAndFlush(300),
      looseWriteAndFlush(500),
      looseWriteAndFlush(130),
      looseWriteAndFlush(700)
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
