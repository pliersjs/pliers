module.exports = function (pliers) {

  pliers.filesets('js', ['*.js', 'test/*.js'])

  pliers('test', function (done) {
    pliers.exec('./node_modules/.bin/mocha -r should -R spec', done)
  })

  pliers('lint', { description: 'Run jshint all on project JavaScript' }, function (done) {
    pliers.exec('jshint lib test', done)
  })

  pliers('qa', 'test', 'lint')

  pliers('watch', function() {
    pliers.watch(
      pliers.filesets.js,
      pliers.tasks.lint)
  })

  //pliers.default('test')
}