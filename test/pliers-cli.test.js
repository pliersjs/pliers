var exec = require('child_process').exec
  , join = require('path').join
  , fixturesPath = join(__dirname, 'fixtures')

describe('pliers-cli.js', function() {

  it('should report error when no default task defined', function(done) {

    exec('node ../../pliers-cli.js', { cwd: fixturesPath }, function(error, stdout, stderr) {
      stderr.should.equal('')
      stdout.should.equal('No default task\n')
      done()
    })

  })

  it('should error with unknown task', function(done) {

    exec('node ../../pliers-cli.js error', { cwd: fixturesPath }, function(error, stdout) {
      error.code.should.equal(2)
      stdout.should.equal('Task not found \'error\'\n')
      done()
    })

  })

  it('should run a task', function(done) {

    exec('node ../../pliers-cli.js fixture', { cwd: fixturesPath }, function(error, stdout) {
      stderr.should.equal('')
      stdout.should.match(/Running task: fixture/)
      done()
    })

  })

  it('should load tasks from a pliers.js in the cwd', function (done) {
    exec('node ../../pliers-cli.js', { cwd: fixturesPath }, function (error, stdout) {
      console.log(stdout)
      done()
    })
  })

})
