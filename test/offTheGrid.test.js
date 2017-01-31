const chai = require("chai");
const sinon = require("sinon");
const mock = require("mock-fs");
const faker = require("faker");
const expect = chai.expect;
const OffTheGrid = require("../src/offTheGrid");
const utils = require("../src/utils");

const mockDir = "./_mock";
const mockLogfile = "_mock.log";
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
  });

  it("should record data in a log file", () => {
    const fakeData = generateFakeData();

    mock({
      [mockDir]: {}
    });

    offTheGrid = new OffTheGrid({
      logFilePath: `${mockDir}/${mockLogfile}`,
      interval: 100000,
      isOnline: false,
      replayImmediately: false,
      callback: () => {}
    });

    return offTheGrid.record(fakeData)
      .then(() => utils.readFile(`${mockDir}/${mockLogfile}`))
      .then((result) => parse(result))
      .then((result) => {
        expect(result[0].data).to.deep.equal(fakeData);
        expect(result[0].timestamp).to.exist;
      });
  });

  it("should flush data from an empty log file and not applying it to the callback", (done) => {
    mock({
      [mockDir]: {}
    });

    let isCalled = false;

    offTheGrid = new OffTheGrid({
      logFilePath: `${mockDir}/${mockLogfile}`,
      interval: 100000,
      isOnline: false,
      replayImmediately: false,
      callback: () => {
        isCalled = true;
      }
    });

    setTimeout(() => {
      expect(isCalled).to.equal(false);
      done();
    }, 100);
    
    offTheGrid._replay();
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
      interval: 100000,
      isOnline: false,
      replayImmediately: false,
      callback: (data) => {
        expect(data).to.deep.equal(fakeData);

        done();
      }
    });
    
    offTheGrid._replay();
  });

  describe("during instantiation", () => {
    afterEach(() => {
      mock.restore();
    });

    it("when offline, should not replay data immediately", (done) => {
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
        interval: 0,
        isOnline: false,
        replayImmediately: true,
        callback: callback
      });

      setTimeout(() => {
        expect(spy.called).to.equal(false);
        done();
      }, 100);
    });

    it("when online, by default does not replay the data immediately", (done) => {
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
        interval: 10000,
        isOnline: true,
        callback: callback
      });

      setTimeout(() => {
        expect(spy.called).to.equal(false);
        done();
      }, 100);
    });

    it("when online, can replay the data immediately", (done) => {
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
        interval: 10000,
        isOnline: true,
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
    });

    it("should record data instead of replaying data when it becomes offline", (done) => {
      const fakeDataOnline = generateFakeData();

      mock({
        [mockDir]: {}
      });

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        interval: 10,
        isOnline: true,
        replayImmediately: true,
        callback: () => {}
      });

      offTheGrid.record(fakeDataOnline);

      setTimeout(() => {
        offTheGrid.setOffline();

        const fakeDataOffline = generateFakeData();

        offTheGrid.record(fakeDataOffline)
          .then(() => utils.readFile(`${mockDir}/${mockLogfile}`))
          .then(parse)
          .then((result) => {
            expect(result[0].data).to.deep.equal(fakeDataOffline);

            done();
          });
      }, 200);
    });

    it("should record when offline and NOT replay when offline within a specified interval", (done) => {
      const spy = sinon.spy();
      const callback = (data) => spy(data);

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        interval: 1000,
        isOnline: false,
        replayImmediately: false,
        callback: callback
      });

      const fakeDataArr = [];
      let fakeData;
      for (let i = 0; i < 3; i++) {
        fakeData = generateFakeData();
        fakeDataArr.push(fakeData);
        offTheGrid.record(fakeData);
      }

      setTimeout(() => {
        expect(spy.called).to.equal(false);
        done();
      }, 1500);
    });


    it("should record when offline and flush when online within a specified interval", (done) => {
      const spy = sinon.spy();
      const callback = (data) => {
        spy();
      };

      offTheGrid = new OffTheGrid({
        logFilePath: `${mockDir}/${mockLogfile}`,
        interval: 1000,
        isOnline: false,
        replayImmediately: false,
        callback: callback
      });

      const fakeDataArr = [];
      let fakeData;
      for (let i = 0; i < 3; i++) {
        fakeData = generateFakeData();
        fakeDataArr.push(fakeData);
        offTheGrid.record(fakeData);
      }

      offTheGrid.setOnline();

      setTimeout(() => {
        expect(spy.called).to.equal(true);
        done();
      }, 1500);
    });
  });
});
