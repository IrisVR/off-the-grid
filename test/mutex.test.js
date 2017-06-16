'use strict';

const chai = require("chai");
const sinon = require("sinon");
const Mutex = require("../src/mutex");
const expect = chai.expect;

let mutex;

describe("Mutex", () => {
  it("should acquire only for one function", (done) => {
    const mutex = new Mutex();
    const spyOne = sinon.spy();
    const spyTwo = sinon.spy();

    const callbackOne = () => {
      setTimeout(() => {
        spyOne();

        expect(spyOne.called).to.equal(true);
        expect(spyTwo.called).to.equal(false);

        mutex.release();

        done();
      }, 200);
    };

    const callbackTwo = () =>  {
      setTimeout(() => {
        spyTwo();

        mutex.release();
      }, 100);
    };

    mutex.acquire(callbackOne);
    mutex.acquire(callbackTwo);
  });

  it("should release and run the waiting functions", (done) =>{
    const mutex = new Mutex();
    const spyOne = sinon.spy();
    const spyTwo = sinon.spy();
    const spyThree = sinon.spy();

    const callbackOne = () => {
      setTimeout(() => {
        spyOne();
        mutex.release();
      }, 200);
    };
    
    const callbackTwo = () => {
      setTimeout(() => {
        spyTwo();
        mutex.release();
      }, 100);
    };
    
    const callbackThree = () => {
      setTimeout(() => {
        spyThree();
        mutex.release();

        expect(spyOne.called).to.equal(true);
        expect(spyTwo.called).to.equal(true);
        expect(spyThree.called).to.equal(true);

        done();
      }, 150);
    };
    
    mutex.acquire(callbackOne);
    mutex.acquire(callbackTwo);
    mutex.acquire(callbackThree);
  });
});

