var exec = require('child_process').exec
  , assert = require('assert')

describe('pliers-cli.js', function() {

  it('should list tasks when no args are passed', function(done) {

    exec('node pliers-cli.js', function(error, stdout) {
      assert.equal('No default task\n', stdout)
      done()
    })

  })

  it('should error with unknown task', function(done) {

    exec('node pliers-cli.js error', function(error, stdout) {
      assert.equal(error.code, 2)
      assert.equal('Task not found \'error\'\n', stdout)
      done()
    })

  })
})