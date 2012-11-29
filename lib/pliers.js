var _ = require('lodash')
  , async = require('async')
  , fs = require('fs')
  , join = require('path').join
  , pexec = require('child_process').exec
  , glob = require('glob')
  , noop = function() {}

require('colors')

function log(color) {
  var args = Array.prototype.slice.call(arguments, 1)
  args.unshift((new Date()).toISOString()[color])
  console.log.apply(console, args)
}

module.exports = function pliers(options) {

  var tasks = {}
    , filesets = {}
    , filesetsPatterns = {}
    , defaultTask
    , subPliers = []
    , logger =
      { debug: log.bind(null, 'cyan')
      , info: log.bind(null, 'grey')
      , warn: log.bind(null, 'magenta')
      , error: log.bind(null, 'red')
      }

  options = _.extend({},
    { input: process.stdin
    , output: process.stdout
    , error: process.stderr
    , logger: logger
    , cwd: process.cwd()
    }, options)

  function addFileset(id, patterns) {
    if ((id === undefined) || !/^([a-z]|[A-Z])+$/.test(id)) {
      throw new Error('Fileset id must not be empty and only contain [a-Z]')
    }
    if (filesetsPatterns[id] !== undefined) {
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

    // Ensure array exists
    if (!filesetsPatterns[id]) {
      filesetsPatterns[id] = []
    }

    // Accept both single patterns and arrays of patterns
    if (!Array.isArray(patterns)) {
      patterns = [patterns]
    }
    filesetsPatterns[id] = filesetsPatterns[id].concat(patterns)

    // Defer the globbing until first use
    function globPattern() {

      if (!filesets[id]) {
        filesets[id] = []
      }

      filesetsPatterns[id].forEach(function(pattern) {
        glob(pattern, { cwd: options.cwd, sync: true }, function(error, files)  {
          filesets[id] = filesets[id].concat(files)
        })
      })

      // filesets[id] = _.uniq(filesets[id])
      return filesets[id]
    }
  }

  function processArgs(name, args) {
    var i = 1
      , fn
      , deps = []

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
          deps = deps.concat(tasks[arg].deps)
          break
        default:
          throw new Error('argument[' + i +
            '] is must be a task name or function')
      }

      i += 1
    })

    // Create a function if none assigned. For composite tasks
    if (fn === undefined) {
      fn = function(done) {
        options.logger.info('Completed task: ' + name)
        done()
      }
    }

    deps.push(fn)
    return deps
  }

  function validateName(name) {
    if ((name === undefined) || !/^([a-z]|[A-Z])+$/.test(name)) {
      throw new Error('Task name must not be empty and only contain [a-Z]')
    } else if (tasks[name] !== undefined) {
      throw new Error('Task \'' + name + '\' already exists')
    }
  }

  function run(name, cb) {
    // Look for build tasks with the same name in sub projects
    // var subs = subPliers.map(function(sub) {
    //   if (sub.task[name]) {
    //     return sub.task[name]
    //   }
    // })

    options.logger.info('Running task: ' + name)

    var deps = []

    if (tasks[name]) {
      deps = deps.concat(tasks[name].deps)
    }
    //async.series(deps.concat(subs), cb || noop)
    async.series(deps, cb || noop)
  }

  function addTask(name) {

    validateName(name)

    var args = Array.prototype.slice.call(arguments, 1)
      , taskOptions
      , deps

    if (args.length === 0) {
      throw new Error('At least one task name or a single function is require')
    } else if (typeof args[0] === 'object') {
      taskOptions = args.shift()
    }

    // Find any dependant tasks in arguments
    deps = processArgs(name, args)

    tasks[name] = {
      deps: deps
    }

    if (taskOptions && taskOptions.description) {
      tasks[name].description = taskOptions.description
    }

    return tasks
  }

  function exec(command, cb) {
    if (command === undefined) {
      throw new Error('You must provide a command')
    }
    options.logger.info('Executing:', command)
    var child = pexec(command, { cwd: options.cwd }, cb)
    child.stdout.pipe(options.output)
    child.stderr.pipe(options.error)

    return child
  }

  function watch(files, fn) {

    function watchFile(file) {
      options.logger.info('Watching ' + file)
      fs.watch(file, function (event) {
        options.logger.debug('Changed ' + file, event)
        if (event !== 'rename') {
          fn()
        }
      })
    }

    files.forEach(function(file) {
      watchFile(file)
    })
  }

  function defaultTaskRunner(taskName) {
    if (taskName !== undefined) {
      defaultTask = taskName
      addTask.hasDefault = tasks[defaultTask] ? true : false
    } else {
      run(defaultTask)
    }
  }

  function load(path) {
    console.log(1,path)
    var sub = pliers(_.extend({}, options, { cwd: path }))
    subPliers.push(sub)
    require(join(path, 'pliers.js'))(sub)
  }

  addTask.watch = watch
  addTask.exec = exec
  addTask.filesets = addFileset
  addTask.tasks = tasks
  addTask.run = run
  addTask.logger = options.logger
  addTask.default = defaultTaskRunner
  addTask.load = load

  return addTask
}
