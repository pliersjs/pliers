module.exports = function(pliers) {

  pliers.filesets('js', ['*.js'])

  pliers('test', function() {
    pliers.logger.info('test task')
  })

  pliers('fixture', function() {
    pliers.logger.info('fixture')
  })

}