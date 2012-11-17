module.exports = function(pliers) {

  pliers.files('js', '*.js')

  pliers('test', function(done) {
    pliers.exec('./node_modules/.bin/mocha -r should -R spec', done)
  })

  pliers('lint', function(done) {
    pliers.exec('jshint lib test', done)
  })

  pliers('qa', 'lint', 'test')

  pliers('watch', function() {
    pliers.watch(
      pliers.files.js,
      pliers.tasks.lint)
  })

  //pliers.default('test')
}