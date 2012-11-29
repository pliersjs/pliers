var exec = require('child_process').exec

describe('pliers-cli.js', function() {

  it('should report error when no default task defined', function(done) {

    exec('node ../pliers-cli.js', { cwd: __dirname }, function(error, stdout, stderr) {
      stderr.should.equal('')
      stdout.should.equal('No default task\n')
      done()
    })

  })

  it('should error with unknown task', function(done) {

    exec('node ../pliers-cli.js error', { cwd: __dirname }, function(error, stdout) {
      error.code.should.equal(2)
      stdout.should.equal('Task not found \'error\'\n')
      done()
    })

  })

  it('should run a task', function(done) {

    exec('node ../pliers-cli.js fixture', { cwd: __dirname }, function(error, stdout) {
      stdout.should.match(/Running task: fixture/)
      done()
    })

  })
})