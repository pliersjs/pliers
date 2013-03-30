var exec = require('child_process').exec
  , join = require('path').join
  , fixturesPath = join(__dirname, 'fixtures')

describe('pliers-cli.js', function () {

  it('should report error when no default task defined', function (done) {

    exec('node ../../pliers-cli.js', { cwd: fixturesPath }, function (error, stdout, stderr) {
      stderr.should.equal('')
      stdout.should.equal('No default task\n')
      done()
    })

  })

  it('should error with unknown task', function (done) {

    exec('node ../../pliers-cli.js unknown', { cwd: fixturesPath }, function (error, stdout, stderr) {
      error.code.should.equal(8)
      stderr.should.match(/.*No task exists.*/)
      done()
    })

  })

  it('should run a task', function (done) {

    exec('node ../../pliers-cli.js greet', { cwd: fixturesPath }, function (error, stdout, stderr) {
      stderr.should.equal('')
      stdout.should.match(/Running task: greet/)
      done()
    })

  })

  it('should load tasks from a pliers.js in the cwd', function (done) {
    exec('node ../../pliers-cli.js greet', { cwd: fixturesPath }, function (error, stdout, stderr) {
      stderr.should.equal('')
      stdout.should.match(/Running task: greet/)
      stdout.should.match(/hello from pliers\.js/)
      done()
    })
  })

  it('should load tasks from a custom path', function (done) {
    exec('node ../../pliers-cli.js -t tasks.js greet', { cwd: fixturesPath }, function (error, stdout, stderr) {
      stderr.should.equal('')
      stdout.should.match(/Running task: greet/)
      stdout.should.match(/hello from tasks\.js/)
      done()
    })
  })

  it('should error with a non-existent task path', function (done) {
    exec('node ../../pliers-cli.js -t tusks.js', { cwd: fixturesPath }, function (error, stdout) {
      stdout.should.match(/Could not load `tusks.js`/)
      error.code.should.equal(1)
      done()
    })
  })

  it('should not mask a load-time error as non-existent file', function (done) {
    exec('node ../../pliers-cli.js -t error.js', { cwd: fixturesPath }, function (error, stdout, stderr) {
      stdout.should.not.match(/Could not load `error.js`\n/)
      stderr.should.match(/uh oh\n/)
      error.code.should.equal(8)
      done()
    })
  })

  it('should kill parent process if task errors returns with a error code', function (done) {
    var child = exec('node ../../pliers-cli.js error', { cwd: fixturesPath }, function (error, stdout, stderr) {
      stderr.should.not.eql(null)
      child.exitCode.should.equal(8)
      done()
    })
  })
})