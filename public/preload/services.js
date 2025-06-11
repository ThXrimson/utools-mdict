const fs = require('node:fs');
const path = require('node:path');
const { MDX } = require('js-mdict');

function getDict(filePath, ext) {
  if (ext === '.mdx') {
    return new MDX(filePath);
  } else {
    throw new Error('Unsupported dictionary file type: ' + ext);
  }
}

// 通过 window 对象向渲染进程注入 nodejs 能力
window.services = {
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
  getBaseName(filePath) {
    return path.basename(filePath);
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
  // 文本写入到下载目录
  writeTextFile(text) {
    const filePath = path.join(
      window.utools.getPath('downloads'),
      Date.now().toString() + '.txt'
    );
    fs.writeFileSync(filePath, text, { encoding: 'utf-8' });
    return filePath;
  },
  // 图片写入到下载目录
  writeImageFile(base64Url) {
    const matchs = /^data:image\/([a-z]{1,20});base64,/i.exec(base64Url);
    if (!matchs) return;
    const filePath = path.join(
      window.utools.getPath('downloads'),
      Date.now().toString() + '.' + matchs[1]
    );
    fs.writeFileSync(filePath, base64Url.substring(matchs[0].length), {
      encoding: 'base64',
    });
    return filePath;
  },
};
