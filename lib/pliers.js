var _ = require('lodash')
  , async = require('async')
  , pexec = require('child_process').exec

module.exports = function(options) {

  options = _.extend({}, {
    output: process.stdout,
    error: process.stderr
  }, options)

  var tasks = {}

  function addTask(name) {
    if ((name === undefined) || !/^([a-z]|[A-Z])+$/.test(name)) {
      throw new Error('Task name must not be empty and only contain [a-Z]')
    }
    if (tasks[name] !== undefined) {
      throw new Error('Task \'' + name + '\' already exists')
    }
    var deps = []
      , fn

    var i = 1
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
    var child = pexec(command, cb)
    child.stdout.pipe(options.output)
    child.stderr.pipe(options.error)
  }

  function addFileset(id, pattern) {

  }

  addTask.exec = exec
  addTask.files = addFileset
  addTask.tasks = tasks

  return addTask;
}