module.exports = function (pliers) {

  pliers.load(__dirname + '/a')
  pliers.filesets('js', ['*.js'])

  pliers('test', function () {
    pliers.logger.info('test task')
  })

  pliers('fixture', function () {
    pliers.logger.info('fixture')
  })

}