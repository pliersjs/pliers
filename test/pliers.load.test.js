var join = require('path').join
  , should = require('should')
  , getPliers = require('./fixtures/get-pliers')

describe('pliers.js', function () {

  describe('load()', function () {

    it('should load valid sub pliers', function () {
      var pliers = getPliers({ cwd: join(__dirname, 'fixtures/load') })
      pliers.load(join(__dirname, 'fixtures/load/a'))
    })

    it('should throw if no sub pliers is found', function (done) {
      var pliers = getPliers({ cwd: join(__dirname, 'fixtures/load') })

      try {
        pliers.load(join(__dirname, 'fail'))
      } catch (e) {
        done()
      }

    })
  })

  describe('run()', function () {
    it('should run root level tasks', function (done) {
      var pliers = getPliers({ cwd: join(__dirname, 'fixtures/load') })

      pliers('test', function (cb) {
        cb()
      })

      pliers.load(join(__dirname, 'fixtures/load/a'))

      pliers.run('test', function (error) {
        should.equal(error, null)
        done()
      })
    })

    it('should only run() tasks in the parent pliers', function () {
      var pliers = getPliers({ cwd: join(__dirname, 'fixtures/load') })

      pliers('test', function (cb) {
        cb()
      })

      pliers.load(join(__dirname, 'fixtures/load/a'))

      try {
        pliers.run('a')
      } catch (e) {
        e.message.should.equal('No task exists \'a\'')
      }
    })
  })

  describe('runAll()', function () {

    it('should first run all sub tasks then parent task', function (done) {

      var pliers = getPliers({ cwd: join(__dirname, 'fixtures/load') })
        , subPliers
        , callOrder = []

      pliers('b', function (cb) {
        callOrder.push(1)
        cb()
      })

      subPliers = pliers.load(join(__dirname, 'fixtures/load/a'))
      subPliers.callOrder = callOrder

      pliers.runAll('b', function () {
        subPliers.callOrder.should.eql([2, 1])
        done()
      })
    })
  })
})