var noop = function () {}
  , assert = require('assert')
  , join = require('path').join
  , Stream = require('stream')
  , fs = require('fs')
  , nullStream = new Stream()
  , exec = require('child_process').exec

nullStream.write = noop
nullStream.end = noop

describe('pliers.js', function () {

  function getPliers(outputStream) {

    return require('..')(
      { logger:
        { debug: noop
        , info: noop
        , warn: noop
        , error: noop }
      , output: outputStream ? undefined : nullStream
      })
  }

  describe('initialize', function () {

    it('should allow a custom cwd via options', function () {
      var pliers = require('..')(
        { logger:
          { debug: noop
          , info: noop
          , warn: noop
          , error: noop }
        , cwd: join(__dirname, 'fixtures')
        , output: nullStream
        })

      pliers.filesets('txt', '*.txt')
      pliers.filesets.txt.should.eql(['watched.txt'])

    })
  })

  describe('pliers()', function () {
    var pliers

    before(function () {
      pliers = getPliers()
      pliers('fixture', noop)
    })

    it('should take a name and a function', function () {
      (function () {
        pliers('name', noop)
      }).should.not.throwError()
    })

    it('should throw if name is missing', function () {
      (function () {
        pliers()
      }).should.throwError('Task name must not be empty and only contain [a-Z]')
    })

    it('should throw if name not made of [a-Z]', function () {
      (function () {
        pliers('New Task!')
      }).should.throwError('Task name must not be empty and only contain [a-Z]')
    })

    it('should throw if second argument is missing', function () {
      (function () {
        pliers('newName')
      }).should.throwError('At least one task name or a single function is require')
    })

    it('should throw if function before last argument', function () {
      (function () {
        pliers('newName', noop, 'name')
      }).should.throwError('function only permitted as the last argument')
    })

    it('should throw if task is already exists', function () {
      (function () {
        pliers('name', noop)
      }).should.throwError('Task \'name\' already exists')
    })

    it('should not throw if second argument is not a defined task', function () {
      (function () {
        pliers('exampleSecond', 'test')
      }).should.not.throwError('No task exists \'test\'')
    })

    it('should not throw if third argument is not a defined task', function () {
      (function () {
        pliers('exampleThrid', 'fixture', 'test')
      }).should.not.throwError('No task exists \'test\'')
    })

    it('should return description if provided', function () {
      pliers('withInfo', { description: 'This is the info' }, noop)
      pliers.tasks.withInfo.description.should.equal('This is the info')
    })

  })

  describe('defaultTask()', function () {
    it('should be empty on init', function (done) {
      var pliers = getPliers()
      pliers('test', function () {
        done()
      })
      pliers.defaultTask('test')
      pliers.defaultTask()
    })
  })

  describe('task', function () {

    it('should be empty on init', function () {
      var pliers = getPliers()
      assert.deepEqual(pliers.tasks, {})
    })

    it('should collect defined tasks', function () {
      var pliers = getPliers()
      pliers('test', noop)
      assert.equal(typeof pliers.tasks.test, 'object')
    })

    describe('task.run()', function () {

      it('should run tasks', function (done) {
        var pliers = getPliers()
        pliers('test', function () {
          done()
        })
        pliers.run('test')
      })

      it('should report when tasks starts and finishes', function (done) {
        var logOutput = []
        function log() {
          logOutput = logOutput.concat(Array.prototype.slice.apply(arguments))
        }
        var pliers = require('..')(
          { logger:
            { debug: log
            , info: log
            , warn: log
            , error: log }
          , output: nullStream
          })
        pliers('test', function (cb) {
          cb()
        })
        pliers.run('test', function () {
          logOutput.should.eql(['Running task: test', 'Completed task: test'])
          done()
        })
      })

      it('should run task then callback if provided', function (done) {
        var pliers = getPliers()
          , run = false

        pliers('test', function (cb) {
          run = true
          cb()
        })
        pliers.run('test', function () {
          assert.ok(run)
          done()
        })
      })

      it('should throw if any of the dependencies task don\'t exist before '
        + 'running task code', function (done) {

        var pliers = getPliers()
          , result = []

        pliers('test', 'a', 'b', function () {
          result.push(1)
          done()
        })

        pliers('a', function (done) {
          result.push(2)
          done()
        })

        try {
          pliers.run('test')
        } catch (e) {
          e.message.should.equal('No task exists \'b\'')
          result.should.eql([])
          done()
        }

      })

      it('should run tasks all dependent tasks in order', function (done) {
        var run = []
          , pliers = getPliers()

        function task(id, cb) {
          run.push(id)
          cb()
        }

        pliers('a', task.bind(null, 'a'))
        pliers('b', task.bind(null, 'b'))
        pliers('c', task.bind(null, 'c'))
        pliers('test', 'c', 'b', 'a')
        pliers.run('test', function () {
          assert.deepEqual(run, ['c', 'b', 'a'])
          done()
        })
      })

      it('should not run dependent tasks more than once', function (done) {
        var run = []
          , pliers = getPliers()

        function task(id, cb) {
          run.push(id)
          cb()
        }

        pliers('a', task.bind(null, 'a'))
        pliers('b', task.bind(null, 'b'))
        pliers('c', 'a', task.bind(null, 'c'))
        pliers('test', 'c', 'b', 'a')
        pliers.run('test', function () {
          assert.deepEqual(run, ['a', 'c', 'b'])
          done()
        })
      })

      it('should error if task doesn\'t exist', function () {
        var pliers = getPliers()

        try {
          pliers.run('test')
        } catch (e) {
          assert.equal(e.message, 'No task exists \'test\'')
        }

      })

      it('should exit(1) if tasks returns a value and no callback is provided', function (done) {

        var pliers = getPliers()
          , originalExit = process.exit

        // Mock process
        process.exit = function (code) {
          code.should.equal(1)
          process.exit = originalExit
          done()
        }

        function task(id, cb) {
          cb(id)
        }

        pliers('a', task.bind(null, 'a'))
        pliers('b', task.bind(null, 'b'))
        pliers('test', 'a', 'b')
        pliers.run('test')
      })

      it('should receive error if callback is provided', function (done) {
        var pliers = getPliers()

        function task(id, cb) {
          cb(new Error('This is an error'))
        }

        pliers('a', task.bind(null, 'a'))
        pliers.run('a', function (error) {
          error.message.should.equal('This is an error')
          done()
        })
      })

    })
  })

  describe('exec()', function () {

    var pliers = getPliers(true)

    it('should throw if no command provided', function () {
      (function () {
        pliers.exec()
      }).should.throwError('You must provide a command')
    })

    // it('should return output', function (done) {
    //   pliers.exec('node -v', function (error, output) {
    //     assert.equal(output.trim().substring(1), process.versions.node)
    //     done()
    //   })
    // })

    it('should inherit the parent process\' stdio', function (done) {
      exec('node test/fixtures/exec', function (err, stdout, stderr) {
        stdout.trim().substring(1).should.equal(process.versions.node)
        stderr.should.equal('')
        done()
      })
    })

    it('should be able to kill processes', function (done) {
      var child = pliers.exec('node', false, function () {
        done()
      })
      child.kill()
    })

    it('should not require a callback', function () {
      pliers.exec('ls')
    })

    it('should error on exec returning an non-zero exit by default', function (done) {
      pliers.exec('ls NO', false, function (error) {
        error.message.should.equal('exec(\'ls NO\') returned with with code 1')
        done()
      })
    })

    it('should halt on error', function (done) {

      exec('node test/fixtures/exec-failure', function (err, stdout, stderr) {
        stderr.should.equal('ls: NO: No such file or directory\n')
        err.code.should.be.above(0)
        done()
      })
    })
  })

  describe('filesets()', function () {
    var pliers = getPliers()

    it('should throw if identifier is missing', function () {
      (function () {
        pliers.filesets()
      }).should.throwError('Fileset id must not be empty and only contain [a-Z]')
    })

    it('should throw if file pattern is missing', function () {
      (function () {
        pliers.filesets('js')
      }).should.throwError('A file pattern is required to define a file set')
    })

    describe('filesets.{id}', function () {
      it('should equal undefined if identifier is unknown', function () {
        assert.strictEqual(pliers.filesets.js, undefined)
      })

      it('should return an array of matching files', function () {
        pliers.filesets('js', __dirname + '/../*.js')

        assert.deepEqual(pliers.filesets.js,
          [ 'pliers-cli.js'
          , 'pliers.js'].map(function (value) {
            return join(__dirname, '..', value)
          }))
      })

      it('should return an array of matching files from an array of patterns',
        function () {

        pliers.filesets('allJs', [__dirname + '/../*.js', __dirname + '/*.js'])
        pliers.filesets.allJs.should.eql(
          [ 'pliers-cli.js'
          , 'pliers.js'].map(function (value) {
            return join(__dirname, '..', value)
          }).concat(
            [ 'pliers-cli.test.js'
            , 'pliers.load.test.js'
            , 'pliers.test.js'].map(function (value) {
              return join(__dirname, '../test/', value)
            })
          ))
      })

      it('should return the same thing on each access', function () {
        pliers.filesets('everything', __dirname + '**')
        assert.deepEqual(pliers.filesets.everything, pliers.filesets.everything)
      })


      it('should allow a 3rd parameter to define exclude patterns', function () {
        pliers.filesets('nothing', __dirname + '**', __dirname + '**')
        assert.deepEqual(pliers.filesets.nothing, [])
      })

      it('should allow exclude patterns to be an array', function () {
        pliers.filesets('excludeArray', __dirname + '/*.js',
          [__dirname + '/*.load.test.js', __dirname + '/*-cli.test.js'])

        assert.deepEqual(pliers.filesets.excludeArray,
          [join(__dirname, '../test/', 'pliers.test.js')])
      })

    })
  })

  describe('watch()', function () {

    it('should call function and pass filename of changed file when a changes happens', function (done) {

      var pliers = getPliers()
        , watchedFile = join(__dirname, 'fixtures', 'watched.txt')

      pliers.filesets('watched', join(__dirname, 'fixtures', '*.txt'))
      pliers.watch(pliers.filesets.watched, function (fsWatcher, filename) {
        filename.should.equal(watchedFile)
        fsWatcher.close()
        done()
      })

      setTimeout(function () {
        fs.utimes(watchedFile, new Date(), new Date())
      }, 200)

    })

    it('should run a task when a file in a fileset changes', function (done) {

      var pliers = getPliers()
        , watchedFile = join(__dirname, 'fixtures', 'watched.txt')

      pliers.filesets('watched', join(__dirname, 'fixtures', '*.txt'))
      pliers.watch(pliers.filesets.watched, function (fsWatcher) {
        fsWatcher.close()
        done()
      })

      setTimeout(function () {
        fs.utimes(watchedFile, new Date(), new Date())
      }, 200)

    })


    it('should only run a task once every 2000 seconds', function (done) {

      var pliers = getPliers()
        , watchedFile = join(__dirname, 'fixtures', 'watched.txt')
        , count = 0

      pliers.filesets('watched', join(__dirname, 'fixtures', '*.txt'))
      pliers.watch(pliers.filesets.watched, function (fsWatcher) {
        fsWatcher.close()
        count++
      })

      setTimeout(function () {
        fs.utimes(watchedFile, new Date(), new Date())
      }, 200)

      setTimeout(function () {
        count.should.equal(1)
        done()
      }, 1000)
    })

    it('should not kill parent process if watch fn() errors', function (done) {
      var pliers = getPliers()
        , watchedFile = join(__dirname, 'fixtures', 'watched.txt')
        , nonFn = 'I am not a function'

      pliers.filesets('watched', join(__dirname, 'fixtures', '*.txt'))
      pliers.watch(pliers.filesets.watched, function (fsWatcher) {
        fsWatcher.close()
        try {
          nonFn()
        } catch (e) {
          e.message.should.equal('string is not a function')
        }
        done()
      })

      setTimeout(function () {
        fs.utimes(watchedFile, new Date(), new Date())
      }, 200)
    })
  })

  describe('getAllTaskNames()', function () {
    it('should return list of defined tasks that changes as more are added', function () {
      var pliers = getPliers()
      pliers.getAllTaskNames().should.eql([])
      pliers('a', function (done) {
        done()
      })
      pliers.getAllTaskNames().should.eql(['a'])
      pliers('b', function (done) {
        done()
      })
      pliers.getAllTaskNames().should.eql(['a', 'b'])
    })
  })

  describe('list()', function () {
    it('should output a list of defined tasks that changes as more are added', function () {
      var pliers = getPliers()
      pliers.getAllTaskNames().should.eql([])
      pliers('a', function (done) {
        done()
      })
      pliers.getAllTaskNames().should.eql(['a'])
      pliers('b', function (done) {
        done()
      })
      pliers.getAllTaskNames().should.eql(['a', 'b'])
    })
  })
})