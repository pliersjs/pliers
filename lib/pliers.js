var _ = require('lodash')
  , async = require('async')
  , fs = require('fs')
  , pexec = require('child_process').exec
  , glob = require('glob')

require('colors')

module.exports = function(options) {

  options = _.extend({}, {
    input: process.stdin,
    output: process.stdout,
    error: process.stderr
  }, options)

  var tasks = {}
    , filesets = {}
    , logger =
      { debug: log.bind(null, 'cyan')
      , info: log.bind(null, 'grey')
      , warn: log.bind(null, 'red')
      , error: log.bind(null, 'red')
      }

  function log(color) {
    var args = Array.prototype.slice.call(arguments, 1)
    args.unshift((new Date()).toISOString()[color])
    console.log.apply(console, args)
  }

  function addTask(name) {
    if ((name === undefined) || !/^([a-z]|[A-Z])+$/.test(name)) {
      throw new Error('Task name must not be empty and only contain [a-Z]')
    }
    if (tasks[name] !== undefined) {
      throw new Error('Task \'' + name + '\' already exists')
    }
    var deps = []
      , fn
      , i = 1
      , args = Array.prototype.slice.call(arguments, 1)

    if (args.length === 0) {
      throw new Error('At least one task name or a single function is require')
    }

    args.forEach(function(arg) {

      switch(typeof arg) {
        case 'function':
          if (i !== args.length) {
            throw new Error('function only permitted as the last argument')
          }
          fn = arg
          break
        case 'string':
          if (tasks[arg] === undefined) {
            throw new Error('No task exists \'' + arg + '\'')
          }
          deps.push(tasks[arg])
          break
        default:
          throw new Error('argument[' + i + '] is must be a task name or function')
      }

      i += 1
    })

    // Create a function if none assigned. For composite tasks
    if (fn === undefined) {
      fn = function(done) {
        done()
      }
    }

    deps.push(fn)

    function run() {
      logger.info('Running task: ' + name)
      async.series(deps)
    }

    // Make the task imitable
    Object.defineProperty(tasks, name,
      { enumerable : true
      , configurable : false
      , get: function() { return run }
      })
  }

  function exec(command, cb) {
    if (command === undefined) {
      throw new Error('You must provide a command')
    }
    logger.info('Executing:', command)
    var child = pexec(command, cb)
    child.stdout.pipe(options.output)
    child.stderr.pipe(options.error)
  }

  function addFileset(id, patterns) {
    if ((id === undefined) || !/^([a-z]|[A-Z])+$/.test(id)) {
      throw new Error('Fileset id must not be empty and only contain [a-Z]')
    }
    if (filesets[id] !== undefined) {
      throw new Error('Fileset \'' + id + '\' already exists')
    }
    if (patterns === undefined) {
     throw new Error('A file pattern is required to define a file set')
    }

    // Define file set as a property of this function.
    Object.defineProperty(addFileset, id,
      { enumerable : true
      , configurable : false
      , get: globPattern
      })

    // Defer the globbing until first use
    function globPattern() {
      if (!filesets[id]) {
        filesets[id] = []

        if (Array.isArray(patterns) === false) {
          patterns = [patterns]
        }
        patterns.forEach(function(pattern) {
          glob(pattern, { sync: true }, function(error, files)  {
            filesets[id] = filesets[id].concat(files)
          })
        })
      }
      return filesets[id]
    }
  }

  function watch(files, fn) {

    function watchFile(file) {
      logger.info('Watching ' + file)
      fs.watch(file, function (event) {
        logger.debug('Changed ' + file, event)
        if (event !== 'rename') {
          fn()
        }
      })
    }

    files.forEach(function(file) {
      watchFile(file)
    })
  }

  addTask.watch = watch
  addTask.exec = exec
  addTask.files = addFileset
  addTask.tasks = tasks
  addTask.logger = logger

  return addTask;
}