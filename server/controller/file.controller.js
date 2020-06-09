const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const multiparty = require('multiparty')

module.exports = {
  async merge (ctx, next) {
    const filename = ctx.request.body
  },
  async upload (ctx, next) {
    const file = ctx.request.body
  }
}
