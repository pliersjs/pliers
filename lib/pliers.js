var uniq = require('lodash.uniq')
  , extend = require('lodash.assign')
  , without = require('lodash.without')
  , async = require('async')
  , join = require('path').join
  , relative = require('path').relative
  , spawn = require('child_process').spawn
  , glob = require('glob')
  , Logger = require('./logger')
  , noop = function () {}
  , version = require('../package.json').version
  , chokidar = require('chokidar')
  , chalk = require('chalk')

module.exports = function pliers(opts) {

  var tasks = {}
    , filesets = {}
    , patterns =
      { include: {}
      , exclude: {}
      }
    , defaultTask
    , subPliers = []
    , loggerOptions
    , options = extend({}
      , { input: process.stdin
        , output: process.stdout
        , error: process.stderr
        , cwd: process.cwd()
        , logLevel: opts.logLevel || 'debug'
        , context: opts.context || null
        }, opts)

  loggerOptions = { context: options.context, level: options.logLevel }
  options.logger = new Logger(loggerOptions)

  function addFileset(id, includePatterns, excludePatterns) {
    // Exclude patterns are optional
    excludePatterns = excludePatterns || []

    // Defer the globbing until first use
    function globPattern() {

      if (!filesets[id]) {
        filesets[id] = []

        // Defining what needs to happen after globbing. For an include pattern
        // the result needs to be concatenated onto the fileset. For an exclude
        // pattern the result needs to be removed from the fileset.
        var groupFns =
          { include: function (files) {
              filesets[id] = filesets[id].concat(files)
            }
          , exclude: function (files) {
              // without expects the second parameter to be a list of values
              // not an array of values to remove. .apply is used to pass the
              // array returned from `glob` as a series of arguments
              filesets[id] = without.apply(null, [ filesets[id] ].concat(files))
            }
          }

        // Iterate through each glob pattern group and execute the appropriate
        // function for the glob output
        Object.keys(patterns).forEach(function (group) {
          patterns[group][id].forEach(function (pattern) {
            var files = glob(pattern, { cwd: options.cwd, sync: true })
            groupFns[group](files)
          })
        })
      }
      return uniq(filesets[id].sort(), true)
    }

    if ((id === undefined) || !/^([a-z]|[A-Z])+$/.test(id)) {
      throw new Error('Fileset id must not be empty and only contain [a-Z]')
    }
    if (patterns.include[id] !== undefined) {
      throw new Error('Fileset \'' + id + '\' already exists')
    }
    if (includePatterns === undefined) {
      throw new Error('A file pattern is required to define a file set')
    }

    // Define file set as a property of this function.
    Object.defineProperty(addFileset, id
      , { enumerable: true
        , configurable: false
        , get: globPattern
        })

    // Creating an object to map pattern group key to function parameter
    var values =
      { include: includePatterns
      , exclude: excludePatterns
      }

    // Iterating through each pattern group, setting default values and
    // converting the values to arrays if they aren't already
    Object.keys(patterns).forEach(function (group) {
      if (!patterns[group][id]) {
        patterns[group][id] = []
      }

      if (Array.isArray(values[group])) {
        values[group] = uniq(values[group])
      } else {
        values[group] = [ values[group] ]
      }
      patterns[group][id] = patterns[group][id].concat(values[group])
    })
  }

  function processArgs(name, args) {
    var i = 1
      , fn
      , deps = []

    args.forEach(function (arg) {
      switch (typeof arg) {
      case 'function':
        if (i !== args.length) {
          throw new Error('function only permitted as the last argument')
        }
        fn = arg
        break
      case 'object':
        deps.push(arg)
        break
      case 'string':
        deps = deps.concat(arg)
        break
      default:
        throw new Error('argument[' + i +
          '] is must be a task name or function')
      }

      i += 1
    })

    // Create a function if none assigned. For composite tasks
    if (fn === undefined) {
      fn = function (done) {
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

  function getTaskFns(name, deps) {

    var fnTaskDeps = []
      , taskDeps

    // Track used task deps
    deps = deps || {}

    // Look for build tasks with the same name in sub projects
    if (tasks[name]) {
      taskDeps = tasks[name].deps

      taskDeps.forEach(function (dep) {
        // Allow groups of tasks to be executed in parallel
        if (Array.isArray(dep)) {
          var arrayTasks
          = dep.map(function (taskName) {
            deps[taskName] = true
            return run.bind(null, taskName)
          })
          fnTaskDeps.push(async.parallel.bind(async, arrayTasks))
        } else if (typeof dep === 'function') {
          fnTaskDeps.push(dep)
        } else if (typeof dep === 'string') {
          //
          if (deps[dep]) {
            return
          }
          deps[dep] = true
          if (getTaskFns(dep, deps).length > 0) {
            fnTaskDeps = fnTaskDeps.concat(run.bind(null, dep))
          } else {
            throw new Error('No task exists \'' + dep + '\'')
          }
        } else {
          throw new Error('This shouldn\'t be reachable')
        }
      })

    }

    return fnTaskDeps
  }

  function subFind(name) {
    var fnTasks = []
    subPliers.forEach(function (sub) {
      fnTasks = fnTasks.concat(sub.subFind(name))
    })

    return fnTasks.concat(getTaskFns(name))
  }

  function runAll(name, cb) {
    options.logger.info('Running all sub tasks and task: ' + name)
    var fnTasks = subFind(name)
    if (fnTasks.length === 0) {
      throw new Error('No task exists \'' + name + '\'')
    }
    async.series(fnTasks, cb)
  }

  function run(name, cb) {

    var time = Date.now()

    options.logger.pushContext(name)
    options.logger.info('Started')

    var fnTasks = uniq(getTaskFns(name))

    if (fnTasks.length === 0) {
      throw new Error('No task exists \'' + name + '\'')
    }
    fnTasks.push(function (cb) {
      var duration = Date.now() - time
      options.logger.info('Completed ' + chalk.green('[' + duration + 'ms]'))
      cb()
    })
    async.series(fnTasks, function (error) {
      if (error) {
        options.logger.error('Error returned from task: ' + name + ' '
          + (error.message || error))
        if (!cb) {
          options.logger.info('Exiting')
          return process.exit(1)
        }
      }
      if (cb) {
        options.logger.popContext()
        cb(error)
      }
    })
  }

  function addTask(name) {
    validateName(name)
    var args = Array.prototype.slice.call(arguments, 1)
      , taskOptions
      , deps

    if (args.length === 0) {
      throw new Error('At least one task name or a single function is require')
    } else if ((!Array.isArray(args[0])) && (typeof args[0] === 'object')) {
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

  function exec(command, cmdOptions, cb) {
    if (typeof cmdOptions === 'function') {
      cb = cmdOptions
      cmdOptions = {}
    }
    cmdOptions = extend(
      { haltOnFailure: true
      , cwd: options.cwd
      }, cmdOptions)

    cb = cb || noop

    if (command === undefined) {
      throw new Error('You must provide a command')
    }
    options.logger.info('Executing ' + command)
    var args = command.trim().split(/ +/)
      , cmd = args.shift()
      ,  child = spawn(cmd, args
        , { cwd: cmdOptions.cwd
          , stdio: [ options.input, options.output, options.error ]
          })

    child.on('exit', function (code) {
      // string concat purely on exec( for linting
      var errorMessage = 'exec' + '(\'' + command + '\') returned with with code ' + code
        , error
      if (code !== 0) {
        options.logger.info(errorMessage)
        if (cmdOptions.haltOnFailure) {
          process.exit(code)
        } else {
          error = new Error(errorMessage)
        }
      }
      cb(error)
    })

    return child
  }

  function watch(files, fn) {

    function watchFile(file) {
      var lastRunTime = 0

      options.logger.trace('Watching: ' + relative(options.cwd, file))

      var watcher = chokidar.watch(file, { persistent: true })

      watcher.on('change', function (path) {
        if (lastRunTime > Date.now() - 2000) return
        lastRunTime = Date.now()
        options.logger.info('Changed: ' + relative(options.cwd, file))
        fn(watcher, path)
      })

    }

    var d = require('domain').create()

    d.on('error', function (error) {
      options.logger.error('Unexpected error while watching')
      options.logger.error(error.stack)
      options.logger.error('Continuing to watch')
    })

    d.run(function () {
      files.forEach(function (file) {
        watchFile(file)
      })
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

  function load(path, loadOptions) {
    var sub = pliers(extend({}, options, { cwd: path }, loadOptions))
      , configPath

    if (path.charAt(0) === '/') {
      configPath = join(path, 'pliers.js')
    } else {
      configPath = join(options.cwd, path, 'pliers.js')
    }

    require(configPath)(sub)
    subPliers.push(sub)
    return sub
  }

  function getAllTaskNames() {
    var taskNames = Object.keys(tasks)
    subPliers.forEach(function (sub) {
      taskNames = taskNames.concat(sub.getAllTaskNames())
    })

    return uniq(taskNames)
  }

  function list() {

    console.log('Tasks from ' + options.cwd + '/pliers.js')

    Object.keys(tasks).forEach(function (taskname) {
      console.log('\t' + taskname + (tasks[taskname].description ? (' - ' +
        tasks[taskname].description) : ''))
    })
    console.log()

    subPliers.forEach(function (sub) {
      sub.list()
    })
  }

  function exists(name) {
    return tasks[name]
  }

  addTask.tasks = tasks
  addTask.watch = watch
  addTask.exec = exec
  addTask.rm = require('rimraf').sync
  addTask.mkdirp = require('mkdirp').sync
  addTask.filesets = addFileset
  addTask.run = run
  addTask.runAll = runAll
  addTask.subFind = subFind
  addTask.logger = options.logger
  addTask.defaultTask = defaultTaskRunner
  addTask.load = load
  addTask.list = list
  addTask.exists = exists
  addTask.getAllTaskNames = getAllTaskNames
  addTask.cwd = options.cwd
  addTask.version = version

  return addTask
}
