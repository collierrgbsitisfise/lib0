#!/usr/bin/env node
import http from 'http'
import path from 'path'
import fs from 'fs'
import * as env from '../environment.js'
import * as number from '../number.js'
import * as logging from 'lib0/logging'

const host = env.getParam('--host', 'localhost')
const port = number.parseInt(env.getParam('--port', '8000'))
const paramOpenFile = env.getParam('-o', '')

/**
 * @type {Object<string,string>}
 */
const types = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  mjs: 'application/javascript',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  json: 'application/json',
  xml: 'application/xml'
}

const root = path.normalize(path.resolve('./'))

const server = http.createServer((req, res) => {
  const url = req.url || '/index.html'
  logging.print(logging.ORANGE, logging.BOLD, req.method || '', ' ', logging.GREY, logging.UNBOLD, url)
  const extension = path.extname(url).slice(1)
  /**
   * @type {string}
   */
  const type = (extension && types[extension]) || types.html
  const supportedExtension = Boolean(type)
  if (!supportedExtension) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end('404: File not found')
    return
  }
  let fileName = url
  if (url === '/') fileName = 'index.html'
  else if (!extension) {
    try {
      fs.accessSync(path.join(root, url + '.html'), fs.constants.F_OK)
      fileName = url + '.html'
    } catch (e) {
      fileName = path.join(url, 'index.html')
    }
  }

  const filePath = path.join(root, fileName)
  const isPathUnderRoot = path
    .normalize(path.resolve(filePath))
    .startsWith(root)

  if (!isPathUnderRoot) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end('404: File not found')
    logging.print(logging.RED, logging.BOLD, 'Not Found: ', logging.GREY, logging.UNBOLD, url)
    return
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      logging.print(logging.RED, logging.BOLD, 'Cannot read file: ', logging.GREY, logging.UNBOLD, url)
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end('404: File not found')
    } else {
      res.writeHead(200, { 'Content-Type': type })
      res.end(data)
    }
  })
})

server.listen(port, host, () => {
  logging.print(logging.BOLD, logging.ORANGE, `Server is running on http://${host}:${port}`)
  if (paramOpenFile) {
    const start = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
    import('child_process').then(cp => {
      cp.exec(`${start} http://${host}:${port}/${paramOpenFile}`)
    })
  }
})
