module.exports = {
  devServer: {
    proxy: {
      '/': {
        target: 'localhost:8080',
        pathRewrite: {
          '^/': '/'
        }
      }
    }
  }
}
