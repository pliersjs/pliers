module.exports = function (pliers) {

  pliers.filesets('js', ['*.js', 'lib/*.js', 'test/*.js'])

  pliers('test', function (done) {
    pliers.exec('./node_modules/.bin/mocha -r should -R spec', done)
  })

  pliers('lint', { description: 'Run jshint all on project JavaScript' }, function (done) {
    pliers.exec('jshint .', false, done)
  })

  pliers('qa', 'test', 'lint')

  pliers('watch', function () {
    pliers.watch(pliers.filesets.js, function () {
      pliers.run('lint')
    })
  })

  //pliers.default('test')
}