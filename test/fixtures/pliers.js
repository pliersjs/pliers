module.exports = tasks

function tasks(pliers) {

  pliers.filesets('all', '**')

  pliers('greet', function (done) {
    pliers.logger.info('hello from pliers.js')
    done()
  })

}