var exec = require('child_process').exec

describe('pliers-cli.js', function() {

  it('should report error when no default task defined', function(done) {

    exec('node pliers-cli.js', function(error, stdout, stderr) {
      stderr.should.equal('')
      stdout.should.equal('No default task\n')
      done()
    })

  })

  it('should error with unknown task', function(done) {

    exec('node pliers-cli.js error', function(error, stdout) {
      error.code.should.equal(2)
      stdout.should.equal('Task not found \'error\'\n')
      done()
    })

  })
})