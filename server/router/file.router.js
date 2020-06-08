
const Router = require('koa-router')
const router = new Router({ prefix: '/upload' })
const FileController = require('../controller/file.controller')

router.post('/merge', FileController.merge)
router.post('/', FileController.upload)

module.exports = router
