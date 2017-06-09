const chai = require("chai");
const sinon = require("sinon");
const mock = require("mock-fs");
const faker = require("faker");
const expect = chai.expect;
const OffTheGrid = require("../src/offTheGrid");
const utils = require("../src/utils");

const mockDir = "./_mock";
const mockLogfile = "_mock.log";
const errMessage = "ENOENT, no such file or directory './_mock/_mock.log'";
let offTheGrid;

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

describe("OffTheGrid", () => {
  afterEach(() => {
    mock.restore();

    offTheGrid._clearTimeouts();
  });

  it("should record data in a log file", () => {
    const fakeData = generateFakeData();

    mock({
      [mockDir]: {}
    });

    offTheGrid = new OffTheGrid({
      logFilePath: `${mockDir}/${mockLogfile}`,
      flushInterval: 100000,
      checkConditionBeforeFlush: () => true,
      replayImmediately: false,
      callback: () => {}
    });

    return utils.readFile(`${mockDir}/${mockLogfile}`)
      .catch((err) => {
        expect(err.message).to.equal(errMessage);

        return offTheGrid.record(fakeData);
      })
      .then(() => utils.readFile(`${mockDir}/${mockLogfile}`))
      .then((result) => parse(result))
      .then((result) => {
        expect(result[0].data).to.deep.equal(fakeData);
        expect(result[0].timestamp).to.exist;
      });
  });

  it("should flush data from a log file and apply it to the callback", (done) => {
    const fakeData = generateFakeData();

    mock({
      [mockDir]: {
        [mockLogfile]: JSON.stringify(fakeData)
      }
    });

    offTheGrid = new OffTheGrid({
      logFilePath: `${mockDir}/${mockLogfile}`,
      flushInterval: 100000,
      checkConditionBeforeFlush: () => true,
      replayImmediately: false,
      callback: (data) => {
        expect(data).to.deep.equal(fakeData);

        utils.readFile(`${mockDir}/${mockLogfile}`)
          .catch((err) => {
            expect(err.message).to.equal(errMessage);

            done();
          });
      }
    });
    
    offTheGrid._replay();
  });

  it("should flush data from a non-existent log file and not applying it to the callback", () => {
    mock({
      [mockDir]: {}
    });

    let isCalled = false;

    offTheGrid = new OffTheGrid({
      logFilePath: `${mockDir}/${mockLogfile}`,
      flushInterval: 100000,
      checkConditionBeforeFlush: () => true,
      replayImmediately: false,
      callback: () => {
        isCalled = true;
      }
    });

    return offTheGrid._replay()
      .then(() => {
        expect(isCalled).to.equal(false);
      });
  });

  it("should flush data from an empty log file and not applying it to the callback", () => {
    mock({
      [mockDir]: {
        [mockLogfile]: ""
      }
    });

    let isCalled = false;

    offTheGrid = new OffTheGrid({
      logFilePath: `${mockDir}/${mockLogfile}`,
      flushInterval: 100000,
      checkConditionBeforeFlush: () => true,
      replayImmediately: false,
      callback: () => {
        isCalled = true;
      }
    });

    return offTheGrid._replay()
      .then(() => {
        expect(isCalled).to.equal(false);
      });
  });

  describe("when encountering corrupt", () => {
    afterEach(() => {
      offTheGrid._clearTimeouts();
    });

    it("should not crash when flushing data from a fully corrupted log file", () => {
      const corruptedData = "!@#$@$HSS-shsgk_#$^!%(@$sfsfgsafkjal12";

      mock({
        [mockDir]: {
          [mockLogfile]: corruptedData
        }
      });

      let isCalled = false;

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 100000,
        checkConditionBeforeFlush: () => true,
        replayImmediately: false,
        callback: (result) => {
          isCalled = true;
        }
      });

      return offTheGrid._replay()
        .then(() => {
          expect(isCalled).to.equal(false);
        });
    });

    it("should not crash when flushing data from a REAL fully corrupted log file", () => {
      let isCalled = false;

      offTheGrid = new OffTheGrid({
        logFilePath: `./corruptedAnalytics.txt`,
        flushInterval: 100000,
        checkConditionBeforeFlush: () => false,
        replayImmediately: false,
        callback: (result) => {
          isCalled = true;
        }
      });

      return offTheGrid._replay()
        .then(() => {
          expect(isCalled).to.equal(false);
        });
    });

    it("should not crash when flushing data from a partially corrupted log file and only apply the clean data", (done) => {
      const corruptedData = "!@#$@$HSS-shsgk_#$^!%(@$sfsfgsafkjal12";
      const cleanData = generateFakeData();
      const data = corruptedData + "\n" + JSON.stringify(cleanData);

      mock({
        [mockDir]: {
          [mockLogfile]: data
        }
      });

      const spy = sinon.spy();
      const callback = (data) => spy(data);

      let isCalled = false;

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 100000,
        checkConditionBeforeFlush: () => false,
        replayImmediately: false,
        callback: callback
      });

      setTimeout(() => {
        expect(spy.called).to.equal(true);
        expect(spy.args[0][0]).to.deep.equal(cleanData);
        done();
      }, 100);

      offTheGrid._replay();
    });
  });

  describe("during instantiation", () => {
    afterEach(() => {
      mock.restore();

      offTheGrid._clearTimeouts();
    });

    it("when condition is not satisfied, should not replay data", (done) => {
      const fakeData = generateFakeData();

      mock({
        [mockDir]: {
          [mockLogfile]: JSON.stringify(fakeData)
        }
      });

      const spy = sinon.spy();
      const callback = (data) => spy(data);

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 10,
        checkConditionBeforeFlush: () => false,
        replayImmediately: true,
        callback: callback
      });

      setTimeout(() => {
        expect(spy.called).to.equal(false);
        done();
      }, 100);
    });

    it("when condition is satisfied, by default does not replay the data immediately", (done) => {
      const fakeData = generateFakeData();

      mock({
        [mockDir]: {
          [mockLogfile]: JSON.stringify(fakeData)
        }
      });

      const spy = sinon.spy();
      const callback = (data) => spy(data);

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 10000,
        checkConditionBeforeFlush: () => true,
        callback: callback
      });

      setTimeout(() => {
        expect(spy.called).to.equal(false);
        done();
      }, 100);
    });

    it("when condition is satisfied, can replay the data immediately", (done) => {
      const fakeData = generateFakeData();

      mock({
        [mockDir]: {
          [mockLogfile]: JSON.stringify(fakeData)
        }
      });

      const spy = sinon.spy();
      const callback = (data) => spy(data);

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 10000,
        checkConditionBeforeFlush: () => true,
        replayImmediately: true,
        callback: callback
      });

      setTimeout(() => {
        expect(spy.called).to.equal(true);
        expect(spy.args[0][0]).to.deep.equal(fakeData);
        done();
      }, 100);

    });
  });

  describe("during life of the app", () => {
    beforeEach(() => {
      mock({
        [mockDir]: {}
      });
    });

    afterEach(() => {
      mock.restore();

      offTheGrid._clearTimeouts();
    });

    it("when a condition is satisfied, but then becomes not satisfied, it should not flush ", (done) => {
      const fakeDataOnline = generateFakeData();
      const fakeDataOffline = generateFakeData();
      const checkOnline = () => true;

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 10,
        checkConditionBeforeFlush: checkOnline,
        replayImmediately: true,
        callback: () => {}
      });

      utils.readFile(`${mockDir}/${mockLogfile}`)
        .catch((err) => {
          expect(err.message).to.equal(errMessage);

          return offTheGrid.record(fakeDataOnline);
        })
        .then(() => {
          setTimeout(() => {
            done();
            utils.readFile(`${mockDir}/${mockLogfile}`)
              .catch((err) => {
                return expect(err.message).to.equal(errMessage);
              })
              .then(() => {
                const checkOffline = () => false;
                offTheGrid._checkerFunction = checkOffline;

                return offTheGrid.record(fakeDataOffline);
              })
              .then(() => {
                setTimeout(() => {
                  utils.readFile(`${mockDir}/${mockLogfile}`)
                    .then(parse)
                    .then((result) => {
                      expect(result[0].data).to.deep.equal(fakeDataOffline);

                      done();
                    });
                }, 100);
              });
          }, 100);
        });
    });

    it("should record when condition is not satisfied and NOT replay when condition is still not satisfied", (done) => {
      const fakeData = generateFakeData();
      const spy = sinon.spy();
      const callback = (data) => spy(data);

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 10,
        checkConditionBeforeFlush: () => false,
        replayImmediately: false,
        callback: callback
      });

      utils.readFile(`${mockDir}/${mockLogfile}`)
        .catch((err) => {
          expect(err.message).to.equal(errMessage);

          return offTheGrid.record(fakeData);
        })
        .then(() => {
          setTimeout(() => {
            expect(spy.called).to.equal(false);

            utils.readFile(`${mockDir}/${mockLogfile}`)
              .then(parse)
              .then((result) => {
                expect(result[0].data).to.deep.equal(fakeData);

                done();
              });
          }, 100);
        });
    });

    it("should record when condition not satisfied and replay when condition is satisfied later", (done) => {
      const fakeData = generateFakeData();
      const spy = sinon.spy();
      const callback = (data) => spy();

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 10,
        checkConditionBeforeFlush: () => false,
        replayImmediately: false,
        callback: callback
      });

      utils.readFile(`${mockDir}/${mockLogfile}`)
        .catch((err) => {
          expect(err.message).to.equal(errMessage);

          return offTheGrid.record(fakeData);
        })
        .then(() => {
          setTimeout(() => {
            expect(spy.called).to.equal(false);

            utils.readFile(`${mockDir}/${mockLogfile}`)
              .then(parse)
              .then((result) => {
                expect(result[0].data).to.deep.equal(fakeData);

                offTheGrid._checkerFunction = () => true;
                
                setTimeout(() => {
                  expect(spy.called).to.equal(true);

                  utils.readFile(`${mockDir}/${mockLogfile}`)
                    .catch((err) => {
                      expect(err.message).to.equal(errMessage);

                      done();
                    });
                }, 100);
              });
          }, 100);
        });
    });

    it("should delete the log file when condition is not satisfied and log file already exceeds the limit", (done) => {
      const spy = sinon.spy();
      const callback = (data) => {
        spy();
      };

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 10,
        checkConditionBeforeFlush: () => false,
        replayImmediately: false,
        cacheSize: 10,
        callback: callback
      });

      utils.readFile(`${mockDir}/${mockLogfile}`)
        .catch((err) => {
          expect(err.message).to.equal(errMessage);

          const fakeDataPromises = [];
          let fakeData;
          for (let i = 0; i < 30; i++) {
            fakeData = generateFakeData();
            fakeDataPromises.push(offTheGrid.record(fakeData));
          }

          return Promise.all(fakeDataPromises);
        })
        .then(() => {
          setTimeout(() => {
            expect(spy.called).to.equal(false);

            utils.readFile(`${mockDir}/${mockLogfile}`)
              .catch((err) => {
                expect(err.message).to.equal(errMessage);
                done();
              });
          }, 100);
        });
    });

    it("should NOT delete the log file when condition is not satisfied and log file does not exceed the limit", (done) => {
      const spy = sinon.spy();
      const callback = (data) => {
        spy();
      };

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        flushInterval: 10,
        checkConditionBeforeFlush: () => false,
        replayImmediately: false,
        cacheSize: 10000000,
        callback: callback
      });

      utils.readFile(`${mockDir}/${mockLogfile}`)
        .catch((err) => {
          expect(err.message).to.equal(errMessage);

          const fakeDataPromises = [];
          let fakeData;
          for (let i = 0; i < 30; i++) {
            fakeData = generateFakeData();
            fakeDataPromises.push(offTheGrid.record(fakeData));
          }

          return Promise.all(fakeDataPromises);
        })
        .then(() => {
          setTimeout(() => {
            expect(spy.called).to.equal(false);

            utils.readFile(`${mockDir}/${mockLogfile}`)
              .then(parse)
              .then((result) => {
                expect(result.length).to.equal(30);

                done();
              });
          }, 100);
        });
    });
  });
});
