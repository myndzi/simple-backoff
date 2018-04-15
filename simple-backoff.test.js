'use strict';

var backoff = require('./simple-backoff.js');
require('should');

describe('Linear backoff', function () {
  var LinearBackoff = backoff.LinearBackoff;
  it('should instantiate with default options', function () {
    new LinearBackoff();
  });
  it('should iterate from min to max by step', function () {
    var b = new LinearBackoff({ min: 0, max: 50, step: 10 });
    [0, 10, 20, 30, 40, 50]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should not exceed max', function () {
    var b = new LinearBackoff({ min: 0, max: 50, step: 100 });
    [0, 50, 50]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should reset correctly', function () {
    var b = new LinearBackoff({ min: 0, max: 50, step: 100 });
    b.next().should.equal(0);
    b.reset();
    b.next().should.equal(0);
  });
  it('should vary with jitter, within bounds and averaging to the current value', function () {
    var b = new LinearBackoff({ min: 100, max: 200, step: 100, jitter: 0.5 });
    var sum = 0, eql = 0, next;
    for (var i = 0; i < 1000; i++) {
      b.reset();
      next = b.next();
      if (next === 100) { eql++; }
      next.should.not.be.below(50);
      next.should.not.be.above(150);
      sum += next;
    }
    eql.should.be.below(50);
    (Math.round(sum/10000)*10).should.eql(100);
  });
});
describe('Exponential backoff', function () {
  var ExponentialBackoff = backoff.ExponentialBackoff;
  it('should instantiate with default options', function () {
    new ExponentialBackoff();
  });
  it('should handle a min value of 0', function () {
    var b = new ExponentialBackoff({ min: 0 });
    b.next().should.not.equal(b.next());
  });
  it('should iterate from min to max by factor', function () {
    var b = new ExponentialBackoff({ min: 0, factor: 2 });
    [0, 1, 2, 4, 8, 16]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should not exceed max', function () {
    var b = new ExponentialBackoff({ min: 0, max: 50, factor: 10 });
    [0, 1, 10, 50, 50]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should reset correctly', function () {
    var b = new ExponentialBackoff({ min: 0, max: 50, factor: 10 });
    b.next().should.equal(0);
    b.reset();
    b.next().should.equal(0);
  });
  it('should vary with jitter, within bounds and averaging to the current value', function () {
    var b = new ExponentialBackoff({ min: 128, max: 256, factor: 2, jitter: 0.5 });
    var sum = 0, eql = 0, next;
    for (var i = 0; i < 1000; i++) {
      b.reset();
      next = b.next();
      if (next === 128) { eql++; }
      next.should.not.be.below(96);
      next.should.not.be.above(160);
      sum += next;
    }
    eql.should.be.below(50);
    (Math.round(sum/4000)*4).should.eql(128);
  });
});
describe('Fibonacci backoff', function () {
  var FibonacciBackoff = backoff.FibonacciBackoff;
  it('should instantiate with default options', function () {
    new FibonacciBackoff();
  });
  it('should handle a min value of 0', function () {
    var b = new FibonacciBackoff({ min: 0 });
    b.next().should.not.equal(b.next());
  });
  it('should iterate from min to max', function () {
    var b = new FibonacciBackoff({ min: 0, max: 34 });
    [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should not exceed max', function () {
    var b = new FibonacciBackoff({ min: 50, max: 50 });
    [50, 50]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should reset correctly', function () {
    var b = new FibonacciBackoff({ min: 0, max: 50 });
    b.next().should.equal(0);
    b.reset();
    b.next().should.equal(0);
  });
  it('should vary with jitter, within bounds and averaging to the current value', function () {
    var b = new FibonacciBackoff({ min: 144, max: 233, jitter: 0.5 });
    var sum = 0, eql = 0, next;
    for (var i = 0; i < 1000; i++) {
      b.reset();
      next = b.next();
      if (next === 144) { eql++; }
      next.should.not.be.below(99.5);
      next.should.not.be.above(188.5);
      sum += next;
    }
    eql.should.be.below(50);
    (Math.round(sum/4000)*4).should.eql(144);
  });
});
describe('Sequence backoff', function () {
  var FixedBackoff = backoff.FixedBackoff;
  it('should require a sequence', function () {
    (function () {
      new FixedBackoff();
    }).should.throw(/FixedBackoff.*must be an array/);
  });
  it('should require sequence to be an array', function () {
    (function () {
      new FixedBackoff({sequence: {}});
    }).should.throw(/FixedBackoff.*must be an array/);
  });
  it('should require sequence to be an array with at least one value', function () {
    (function () {
      new FixedBackoff({sequence: []});
    }).should.throw(/FixedBackoff.*must be an array/);
  });
  it('should require sequence to contain only integers >= 0', function () {
    [ -1, Infinity, 'foo', new Date(), null, void 0, 1.2 ]
    .forEach(function (v) {
      (function () {
        new FixedBackoff({sequence: [v]});
      }).should.throw(/FixedBackoff.*must be an array/);
      (function () {
        new FixedBackoff({sequence: [1, v]});
      }).should.throw(/FixedBackoff.*must be an array/);
    });
  });
  it('should fail if min or max are specified', function () {
    (function () {
      new FixedBackoff({sequence: [1], min: 0});
    }).should.throw(/FixedBackoff.*is invalid/);
    (function () {
      new FixedBackoff({sequence: [1], max: 0});
    }).should.throw(/FixedBackoff.*is invalid/);
  });
  it('should instantiate with default options, with a valid sequence', function () {
    new FixedBackoff({ sequence: [0, 1, 10] });
  });
  it('should iterate through the sequence, repeating on the last value', function () {
    var b = new FixedBackoff({ sequence: [0, 3, 10] });
    [0, 3, 10, 10]
    .forEach(function (val) {
      b.next().should.equal(val);
    });
  });
  it('should reset correctly', function () {
    var b = new FixedBackoff({ sequence: [0, 3, 10] });
    b.next().should.equal(0);
    b.next().should.equal(3);
    b.reset();
    b.next().should.equal(0);
  });
  it('should vary with jitter, within bounds and averaging to the current value (first item)', function () {
    var b = new FixedBackoff({ sequence: [100, 300, 500], jitter: 0.5 });
    var sum = 0, eql = 0, next;
    for (var i = 0; i < 1000; i++) {
      b.reset();
      next = b.next();
      if (next === 100) { eql++; }
      next.should.not.be.below(50);
      next.should.not.be.above(150);
      sum += next;
    }
    eql.should.be.below(50);
    (Math.round(sum/10000)*10).should.eql(100);
  });
  it('should vary with jitter, within bounds and averaging to the current value (second item)', function () {
    var b = new FixedBackoff({ sequence: [100, 148, 500], jitter: 0.5 });
    var sum = 0, eql = 0, next;
    for (var i = 0; i < 1000; i++) {
      b.reset();
      b.next();
      next = b.next();
      if (next === 148) { eql++; }
      next.should.not.be.below(136);
      next.should.not.be.above(160);
      sum += next;
    }
    eql.should.be.below(50);
    (Math.round(sum/10000)*10).should.eql(150);
  });
});
