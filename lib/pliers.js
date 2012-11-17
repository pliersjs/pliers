var _ = require('lodash')
  , async = require('async')
  , pexec = require('child_process').exec
  , glob = require('glob')

module.exports = function(options) {

  options = _.extend({}, {
    input: process.stdin,
    output: process.stdout,
    error: process.stderr
  }, options)

  var tasks = {}
    , filesets = {}

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
    tasks[name] = async.series.bind(async, deps);
  }

  function exec(command, cb) {
    if (command === undefined) {
      throw new Error('You must provide a command')
    }
    pexec(command, { stdio: [options.input, options.output, options.error] }, cb)
  }

  function addFileset(id, pattern) {
    if ((id === undefined) || !/^([a-z]|[A-Z])+$/.test(id)) {
      throw new Error('Fileset id must not be empty and only contain [a-Z]')
    }
    if (filesets[id] !== undefined) {
      throw new Error('Fileset \'' + id + '\' already exists')
    }
    if (pattern === undefined) {
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
        glob(pattern, { sync: true }, function(error, files)  {
          filesets[id] = files
        })
      }
      return filesets[id]
    }
  }

  addTask.exec = exec
  addTask.files = addFileset
  addTask.tasks = tasks

  return addTask;
}