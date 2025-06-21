const axios = require('axios')

/**
 * 在Deeplx上搜索单词
 * @param {string} word - 要搜索的单词
 */
function searchDeeplx(word) {
  return axios.post('https://deepl.deno.dev/translate', {
    text: word,
    target_lang: 'ZH',
    source_lang: 'auto',
  })
}

module.exports = {
  searchDeeplx,
}
