const { MDX, Mdict, MDD } = require('js-mdict')
const fs = require('node:fs/promises')
const files = require('./files')
const path = require('node:path')
const { fork } = require('child_process')
const { deserializeDict } = require('./serde-mdict/serialize-mdict-base')
const persistentTrie = require('./persistent-trie')

const DICT_DIR = 'dictionaries'
const SERDE_DIR = 'serde'

const DICT_MAP = new Map()

/**
 * 关闭词典，并从全局词典映射中删除
 * @param {string} dictID - 词典ID
 * @param {Mdict} dict - 词典对象
 */
function closeDict(dictID, dict) {
  if (dict && dict.close) {
    dict.close()
    DICT_MAP.delete(dictID)
  }
}

/**
 * @param {string} dictID - 词典ID
 * @param {string} typ - 文件类型：mdx
 * @returns {string} - 返回词典文件的完整路径
 */
async function getDictFilePath(dictID, typ) {
  const dictFilePath = path.join(
    files.getAppDataPath(),
    DICT_DIR,
    dictID + (typ == 'mdx' ? '.mdx' : '.mdd')
  )
  await fs.mkdir(path.dirname(dictFilePath), { recursive: true })
  return dictFilePath
}

/**
 * @param {string} dictID - 词典ID
 * @param {string} typ - 文件类型：mdx
 * @returns {string} - 返回词典对象序列化后的完整路径
 */
async function getDictSerdePath(dictID, typ) {
  const dictSerdePath = path.join(
    files.getAppDataPath(),
    SERDE_DIR,
    dictID + (typ == 'mdx' ? '.mdx' : '.mdd') + '.dat'
  )
  await fs.mkdir(path.dirname(dictSerdePath), { recursive: true })
  return dictSerdePath
}

/**
 * 加载Mdict文件
 * @param {string} dictID - 词典ID
 * @param {string} typ - 文件类型：mdx
 * @throws {Error} 如果文件类型不支持
 * @returns {Promise<Mdict>} - 返回加载的词典对象
 */
async function getDict(dictID, typ) {
  if (typ !== 'mdx' && typ !== 'mdd') {
    throw new Error('Unsupported dictionary file type: ' + typ)
  }
  if (DICT_MAP.has(dictID)) {
    // 如果词典已加载，则直接返回
    return DICT_MAP.get(dictID)
  }
  const serdePath = await getDictSerdePath(dictID, typ)
  if (files.existsSync(serdePath)) {
    // 如果序列化文件存在，则反序列化
    const serializedDict = await fs.readFile(serdePath)
    const dict = deserializeDict(serializedDict)
    DICT_MAP.set(dictID, dict) // 更新词典映射
    return DICT_MAP.get(dictID)
  }
  if (files.existsSync(await getDictFilePath(dictID, typ))) {
    // 如果词典文件存在，则加载词典
    let dict
    if (typ === 'mdx') {
      dict = new MDX(await getDictFilePath(dictID, typ))
    } else if (typ === 'mdd') {
      dict = new MDD(await getDictFilePath(dictID, typ))
    } else {
      throw new Error('Unsupported dictionary file type: ' + typ)
    }
    DICT_MAP.set(dictID, dict) // 更新词典映射
    return DICT_MAP.get(dictID)
  }
}

/**
 *
 * @param {string} dictID - 词典ID
 * @param {string} searchTerm - 要搜索的单词或短语
 * @returns {Promise<{word: any, definition: string | null}[]>} - 返回搜索结果数组
 */
async function searchDict(dictID, searchTerm) {
  // TODO 后续可能扩展 mdd 支持
  // const dict = await getDict(dictID, 'mdx')
  // const res = dict.lookupAll(searchTerm)
  // closeDict(dictID, dict)
  // return res
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'dict-worker.js')
    const worker = fork(workerPath)
    worker.send({ task: 'search', args: { dictID, searchTerm } })
    worker.on('message', async (msg) => {
      if (msg.status === 'done') {
        const results = msg.results
        resolve(results)
      } else if (msg.status === 'closed') {
        worker.kill()
        resolve()
      } else if (msg.status === 'error') {
        worker.kill()
        reject(new Error(msg.error))
      }
    })
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`))
    })
  })
}

/**
 * 添加词典
 * @param {string} dictID - 词典ID
 * @param {string} originalDictFilePath - 原始词典文件路径
 */
async function addDict(dictID, originalDictFilePath) {
  const typ = getType(originalDictFilePath)
  const dictFilePath = await getDictFilePath(dictID, typ)
  await fs.copyFile(originalDictFilePath, dictFilePath)
  // // 计算密集耗时操作
  // const dict = await getDict(dictID, typ)
  // await Promise.all([
  //   insertWords(dict.keywordList.map((item) => item.keyText)),
  //   (async () => {
  //     const serializedDict = serializeDict(dict)
  //     await fs.writeFile(serdePath, serializedDict)
  //   })(),
  // ])
  // // 计算密集耗时操作
  // closeDict(dictID, dict)
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'dict-worker.js')
    const worker = fork(workerPath)
    worker.send({
      task: 'addDict',
      args: {
        dictID,
        typ,
      },
    })
    worker.on('message', async (msg) => {
      if (msg.status === 'done') {
        persistentTrie.init(true) // 重新初始化Trie
      } else if (msg.status === 'closed') {
        worker.kill()
        resolve()
      } else if (msg.status === 'error') {
        worker.kill()
        reject(new Error(msg.error))
      }
    })
    worker.on('error', reject)
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker exited with code ${code}`))
    })
  })
}

/**
 *
 * @param {string} dictID
 * @returns
 */
async function removeDict(dictID) {
  const dict = DICT_MAP.get(dictID)
  DICT_MAP.delete(dictID)
  if (dict) {
    closeDict(dictID, dict)
  }
  const dictFilePath = await getDictFilePath(dictID, 'mdx')
  if (files.existsSync(dictFilePath)) {
    await fs.unlink(dictFilePath)
  }
  const serdePath = await getDictSerdePath(dictID, 'mdx')
  if (files.existsSync(serdePath)) {
    await fs.unlink(serdePath)
  }
  return true
}

function getType(dictFilePath) {
  const ext = files.getExtension(dictFilePath)
  if (ext === '.mdx') {
    return 'mdx'
  } else if (ext === '.mdd') {
    return 'mdd'
  } else {
    throw new Error('Unsupported dictionary file type: ' + ext)
  }
}

module.exports = {
  searchDict,
  addDict,
  removeDict,
  getDict,
  closeDict,
  getDictSerdePath,
}
