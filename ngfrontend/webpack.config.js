module.exports = {
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    fallback: { "http": false, "browser": false, "https": false,
      "stream": false, "url": false, "buffer": false, "timers": false, "os": false, "path": false
    }
  },
}
