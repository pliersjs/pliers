var noop = function () {}
  , join = require('path').join
  , Stream = require('stream')
  , should = require('should')

describe('pliers.js', function () {

  function getPliers() {

    var writable = new Stream()
    writable.write = noop
    writable.end = noop

    return require('..')(
      { logger:
        { debug: noop
        , info: noop
        , warn: noop
        , error: noop }
      , output: writable
      , cwd: join(__dirname, 'fixtures/load')
      })
  }

  describe('load()', function () {

    it('should load valid sub pliers', function () {
      var pliers = getPliers()
      pliers.load(join(__dirname, 'fixtures/load/a'))
    })

    it('should throw if no sub pliers is found', function (done) {
      var pliers = getPliers()

      try {
        pliers.load(join(__dirname, 'fail'))
      } catch (e) {
        done()
      }

    })

    it('should run root level tasks', function (done) {
      var pliers = getPliers()

      pliers('test', function (cb) {
        cb()
      })

      pliers.load(join(__dirname, 'fixtures/load/a'))

      pliers.run('test', function (error) {
        should.equal(error, null)
        done()
      })
    })

    it('should run sub pliers tasks', function (done) {
      var pliers = getPliers()

      pliers('test', function (cb) {
        cb()
      })

      pliers.load(join(__dirname, 'fixtures/load/a'))

      pliers.run('a', function (error) {
        should.equal(error, null)
        done()
      })
    })

    it('should first run parent task then all sub tasks', function (done) {

      var pliers = getPliers()
        , subPliers
        , callOrder = []

      pliers('b', function (cb) {
        callOrder.push(1)
        cb()
      })

      subPliers = pliers.load(join(__dirname, 'fixtures/load/a'))
      subPliers.callOrder = callOrder

      subPliers = pliers.run('b', function () {
        subPliers.callOrder.should.eql([1, 2])
        done()
      })

    })

  })
})