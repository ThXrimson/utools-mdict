const fs = require('node:fs')
const path = require('node:path')
const { APP_NAME } = require('./constants')
const crypto = require('crypto')
const os = require('os')

/**
 * 计算文件的校验和
 * @param {string} path - 文件路径
 * @returns {Promise<string>} - 返回文件的校验和（SHA-256）
 * @throws {Error} 如果文件读取失败或路径无效
 */
function checksumFile(path) {
  const algorithm = 'sha256'
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash(algorithm)
    const stream = fs.createReadStream(path)

    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', (err) => reject(err))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

/**
 * 获取文件的扩展名
 * @param {string} filePath - 文件路径
 * @returns {string} - 文件扩展名（小写），例如 '.txt', '.mdx'
 * 如果没有扩展名，则返回空字符串 ''
 */
function getExtension(filePath) {
  return path.extname(filePath).toLowerCase()
}

/**
 * 获取文件的基本名称（不包含扩展名）
 * @param {string} filePath - 文件路径
 * @returns {string} - 文件基本名称，例如 'example'，如果文件名为
 * 'example.txt'，则返回 'example'
 */
function getBasenameWithoutExt(filePath) {
  return path.basename(filePath, path.extname(filePath))
}

/**
 * 检查给定路径是否为文件
 * @param {string} path
 * @returns {boolean} - 如果路径是文件则返回 true，否则返回 false
 * 如果路径不存在或无法访问，则返回 false
 */
function isFile(path) {
  try {
    const stats = fs.statSync(path)
    return stats.isFile()
  } catch (err) {
    return false
  }
}

/**
 * 检查给定路径是否为存在
 * @param {string} path - 文件或目录路径
 * @returns {boolean} - 如果路径存在则返回 true，否则返回 false
 * 如果路径不存在或无法访问，则返回 false
 */
function existsSync(path) {
  try {
    fs.accessSync(path, fs.constants.F_OK)
  } catch (err) {
    return false
  }
  return true
}

/**
 * 使用异步方式读取文件内容，使用utf-8编码
 * @param {string} file - 文件路径
 * @returns {Promise<string>} - 文件内容
 */
async function readFile(file) {
  return fs.readFileSync(file, { encoding: 'utf-8' })
}

/**
 * 获取应用数据目录路径
 * 该目录通常用于存储应用的配置文件、缓存等数据
 * @returns {string} - 应用数据目录路径
 */
function getAppDataPath() {
  appDataPath = path.join(os.homedir(), 'AppData', 'Local', APP_NAME)
  return appDataPath
}

module.exports = {
  getExtension,
  getBasenameWithoutExt,
  isFile,
  existsSync,
  readFile,
  getAppDataPath,
  checksumFile,
}
