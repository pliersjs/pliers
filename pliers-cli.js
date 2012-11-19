#!/usr/bin/env node
var program = require('commander')
  , pliers = require('./lib/pliers')()
  , config = require('./pliers.js')

program
  .version(require('./package.json').version)
  .usage('[task] [options]')
  .option('-r, --require <name>', 'require the given module')
  .parse(process.argv)

config(pliers)

var taskName = program.args[0]

if (taskName === undefined) {

  Object.keys(pliers.tasks).forEach(function(taskname) {
    console.log(taskname)
  })

  process.exit()
}

if (!pliers.tasks[taskName]) {
  console.log('Task not found \'' + taskName + '\'')
  return process.exit(2)
}

pliers.tasks[program.args[0]]()