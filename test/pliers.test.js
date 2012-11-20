var noop = function() {}
  , assert = require('assert')
  , join = require('path').join
  , Stream = require('stream')

describe('pliers.js', function() {

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
      })
  }

  var pliers = getPliers()

  pliers('fixture', noop)

  it('should take a name and a function', function() {
    (function() {
      pliers('name', noop)
    }).should.not.throw()
  })

  it('should throw if name is missing', function() {
    (function() {
      pliers()
    }).should.throw('Task name must not be empty and only contain [a-Z]')
  })

  it('should throw if name not made of [a-Z]', function() {
    (function() {
      pliers('New Task!')
    }).should.throw('Task name must not be empty and only contain [a-Z]')
  })

  it('should throw if second argument is missing', function() {
    (function() {
      pliers('newName')
    }).should.throw('At least one task name or a single function is require')
  })

  it('should throw if function before last argument', function() {
    (function() {
      pliers('newName', noop, 'name')
    }).should.throw('function only permitted as the last argument')
  })

  it('should throw if task is already exists', function() {
    (function() {
      pliers('name', noop)
    }).should.throw('Task \'name\' already exists')
  })

  it('should throw if second argument is not a defined task', function() {
    (function() {
      pliers('exampleSecond', 'test')
    }).should.throw('No task exists \'test\'')
  })

  it('should throw if third argument is not a defined task', function() {
    (function() {
      pliers('exampleThrid', 'fixture', 'test')
    }).should.throw('No task exists \'test\'')
  })

  it('should return description if provided', function() {
    pliers('withInfo', { description: 'This is the info' }, noop)
    pliers.tasks.withInfo.description.should.equal('This is the info')
  })

  describe('#default', function() {
    it('should be empty on init', function(done) {
      var pliers = getPliers()
      pliers('test', function() {
        done()
      })
      pliers.default('test')
      pliers.default()
    })
  })

  describe('#task', function() {

    it('should be empty on init', function() {
      var pliers = getPliers()
      assert.deepEqual(pliers.tasks, {})
    })

    it('should collect defined tasks', function() {
      var pliers = getPliers()
      pliers('test', noop)
      assert.equal(typeof pliers.tasks.test, 'function')
    })

    describe('#task.fn()', function() {
      it('should run tasks', function(done) {
        var pliers = getPliers()
        pliers('test', function() {
          done()
        })
        pliers.tasks.test()
      })

      it('should run task then callback if provided', function(done) {
        var pliers = getPliers()
          , run = false

        pliers('test', function(cb) {
          run = true
          cb()
        })
        pliers.tasks.test(function() {
          assert.ok(run)
          done()
        })
      })

      it('should run tasks all dependent tasks in order', function(done) {
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
        pliers.tasks.test(function() {
          assert.deepEqual(run, ['c', 'b', 'a'])
          done()
        })
      })
    })
  })

  describe('#exec()', function() {

    var pliers = getPliers()

    it('should throw if no command provided', function() {
      (function() {
        pliers.exec()
      }).should.throw('You must provide a command')
    })

    it('should return output', function(done) {
      pliers.exec('node -v', function(error, output) {
        assert.equal(output.trim().substring(1), process.versions.node)
        done()
      })
    })
  })

  describe('#default()', function() {
    var pliers = getPliers()

    it('should throw if no command provided', function() {
      (function() {
        pliers.exec()
      }).should.throw('You must provide a command')
    })

    it('should return output', function(done) {
      pliers.exec('node -v', function(error, output) {
        assert.equal(output.trim().substring(1), process.versions.node)
        done()
      })
    })
  })

  describe('#files()', function() {
    var pliers = getPliers()

    it('should throw if identifier is missing', function() {
      (function() {
        pliers.files()
      }).should.throw('Fileset id must not be empty and only contain [a-Z]')
    })

    it('should throw if file pattern is missing', function() {
      (function() {
        pliers.files('js')
      }).should.throw('A file pattern is required to define a file set')
    })

    describe('#files.{id}', function() {
      it('should equal undefined if identifier is unknown', function() {
        assert.strictEqual(pliers.files.js, undefined)
      })

      it('should return an array of matching files', function() {
        pliers.files('js', __dirname + '/../*.js')

        assert.deepEqual(pliers.files.js,
          [ 'pliers-cli.js'
          , 'pliers.js'].map(function(value) {
            return join(__dirname , '..', value)
          }))
      })

      it('should return an array of matching files from an array of patterns',
        function() {

        pliers.files('allJs', [__dirname + '/../*.js', __dirname + '/*.js'])
        pliers.files.allJs.should.eql(
          [ 'pliers-cli.js'
          , 'pliers.js'].map(function(value) {
            return join(__dirname , '..', value)
          }).concat(
          [ join(__dirname , 'pliers-cli.test.js')
          , join(__dirname , 'pliers.test.js')]))
      })
    })
  })
})