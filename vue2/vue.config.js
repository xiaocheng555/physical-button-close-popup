const { defineConfig } = require('@vue/cli-service')
const path = require('path')

const isProduction = process.env.NODE_ENV === 'production'

module.exports = defineConfig({
  publicPath: isProduction ? '././' : '/',
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.join(__dirname, './src')
      }
    }
  }
})
