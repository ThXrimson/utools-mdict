const fs = require('node:fs');
const path = require('node:path');
const { MDX } = require('js-mdict');
const axios = require('axios');

// import fs from 'node:fs';
// import path from 'node:path';
// import { MDX } from 'js-mdict';
// import axios from 'axios';

function getDict(filePath, ext) {
  if (ext === '.mdx') {
    return new MDX(filePath);
  } else {
    throw new Error('Unsupported dictionary file type: ' + ext);
  }
}
console.log('preload services.js loaded');
// 通过 window 对象向渲染进程注入 nodejs 能力
window.services = {
  searchDeeplx(word) {
    return axios.post('https://deepl.deno.dev/translate', {
      text: word,
      target_lang: 'ZH',
      source_lang: 'auto',
    });
  },
  searchDict(filePath, ext, searchTerm) {
    const dict = getDict(filePath, ext);
    const candidates = dict.prefix(searchTerm);
    if (candidates.length === 0) {
      return [];
    }
    return candidates.map((candidate) => {
      const record = dict.fetch(candidate);
      return {
        word: candidate.keyText,
        definition: record.definition,
      };
    });
  },
  getExt(filePath) {
    return path.extname(filePath).toLowerCase();
  },
  getBasenameWithoutExt(filePath) {
    return path.basename(filePath, path.extname(filePath));
  },
  // 检查是否是文件
  isFile(path) {
    try {
      const stats = fs.statSync(path);
      return stats.isFile();
    } catch (err) {
      return false;
    }
  },
  // 检查文件是否存在
  existsSync(path) {
    try {
      fs.accessSync(path, fs.constants.F_OK);
    } catch (err) {
      return false;
    }
    return true;
  },
  // 读文件
  readFile(file) {
    return fs.readFileSync(file, { encoding: 'utf-8' });
  },
};
