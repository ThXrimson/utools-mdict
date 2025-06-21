// dict-worker.js

// const { parentPort } = require('worker_threads') // 如果用worker_threads
// 或用process.on('message') 如果用 child_process.fork

// 假设getDict 和 closeDict 导入正常
const { getDict, closeDict, getDictSerdePath } = require('./mdict.js')
const { serializeDict } = require('./serde-mdict/serialize-mdict-base')
const { insertWords } = require('./persistent-trie')
const fs = require('node:fs/promises')

process.on('message', async (msg) => {
  const { task, args } = msg
  if (task == 'addDict') {
    const { dictID, typ } = args
    try {
      const dict = await getDict(dictID, typ)
      await Promise.all([
        insertWords(dict.keywordList.map((item) => item.keyText)),
        (async () => {
          const serdePath = await getDictSerdePath(dictID, typ)
          const serializedDict = serializeDict(dict)
          await fs.writeFile(serdePath, serializedDict)
        })(),
      ])
      // 先将计算结果返回渲染进程 (主进程) 以便后续操作
      process.send({ status: 'done' })
      // 关闭字典操作
      closeDict(dictID, dict)
      process.send({ status: 'closed' })
    } catch (error) {
      process.send({ status: 'error', error: error.message })
    }
  } else if (task == 'search') {
    const { dictID, searchTerm } = args
    try {
      // TODO 后续可能扩展 mdd 支持
      const dict = await getDict(dictID, 'mdx')
      const results = dict.lookupAll(searchTerm)
      process.send({ status: 'done', results })
      closeDict(dictID, dict)
    } catch (error) {
      process.send({ status: 'error', error: error.message })
    }
  } else {
    process.send({ status: 'error', error: 'Unknown task' })
  }
})
