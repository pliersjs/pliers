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

if (!pliers.tasks[taskName]) {
  return console.log('Task not found [' + taskName + ']')
}

pliers.tasks[program.args[0]]()