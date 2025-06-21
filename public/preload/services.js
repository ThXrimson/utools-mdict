const { searchDict, addDict, removeDict } = require('./mdict.js')
const {
  checksumFile,
  getBasenameWithoutExt,
  existsSync,
  isFile,
} = require('./files.js')
const { searchPrefix, init, saveTrie } = require('./persistent-trie.js')
// 通过 window 对象向渲染进程注入 nodejs 能力
window.services = {
  dicts: {
    searchDict,
    addDict,
    removeDict,
  },
  files: {
    checksumFile,
    getBasenameWithoutExt,
    existsSync,
    isFile,
  },
  trie: {
    init,
    searchPrefix,
    saveTrie,
  },
}
