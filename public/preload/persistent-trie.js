const { Trie } = require('cpp_persistent_trie')
const files = require('./files')
const path = require('node:path')
const fs = require('node:fs/promises')
const { TRIE_FILE_NAME } = require('./constants')

let trie = null

async function getTrieFilePath() {
  const trieFilePath = path.join(files.getAppDataPath(), TRIE_FILE_NAME)
  await fs.mkdir(path.dirname(trieFilePath), { recursive: true })
  return trieFilePath
}

/**
 * 初始化Trie
 */
async function init(reinit = false) {
  if (trie && !reinit) {
    return
  }
  const trieFilePath = await getTrieFilePath()
  trie = new Trie()
  if (files.existsSync(trieFilePath)) {
    trie.load(trieFilePath)
  }
}

/**
 * 获得Trie实例
 * @returns {Promise<Trie>} - 返回Trie实例
 */
async function getTrie() {
  if (trie) {
    return trie
  }
  await init()
  return trie
}

/**
 * 前缀搜索
 * @param {string} searchTerm - 要搜索的单词或短语
 * @param {number} limit - 限制返回结果的数量，-1表示不限制
 * @returns {Promise<string[]>} - 返回匹配的项
 */
async function searchPrefix(searchTerm, limit = -1) {
  await init()
  const results = trie.searchPrefix(searchTerm, limit)
  return results
}

/**
 * 添加单词到Trie
 * @param {string[]} words - 要添加的单词
 * @returns {Promise<boolean} - 返回是否成功保存Trie
 */
async function insertWords(words) {
  const trie = await getTrie()
  for (const word of words) {
    trie.insert(word)
  }
  saveTrie()
  return true
}

/**
 * 持久化Trie到文件
 * @returns {Promise<boolean>} - 返回是否成功保存Trie
 */
async function saveTrie() {
  if (!trie) {
    return false
  }
  const trieFilePath = await getTrieFilePath()
  await trie.save(trieFilePath)
  return true
}

module.exports = {
  searchPrefix,
  insertWords,
  init,
  saveTrie,
}
