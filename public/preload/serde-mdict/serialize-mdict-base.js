const { MDX, KeyWordItem, Mdict } = require('js-mdict')
const { FileScanner } = require('./scanner.js')
const {
  KeyWordItem: KeyWordItemFBS,
  KeyWordItemList: KeyWordItemListFBS,
} = require('./fbs/keyword-list.js')
const flatbuffers = require('flatbuffers')
const { encode, decode } = require('@msgpack/msgpack')

/**
 * 序列化 KeyWordItem 数组为 Uint8Array
 * 使用 FlatBuffers 序列化格式
 * @param {KeyWordItem[]} arr
 * @returns {Uint8Array} - 返回序列化后的 Uint8Array
 */
function serialize(arr) {
  const builder = new flatbuffers.Builder(1024)

  // 先构建所有 KeyRecord 的偏移量
  const offsets = arr.map((record) => {
    const keyTextOffset = builder.createString(record.keyText)

    KeyWordItemFBS.startKeyWordItem(builder)
    KeyWordItemFBS.addRecordStartOffset(builder, record.recordStartOffset)
    KeyWordItemFBS.addRecordEndOffset(builder, record.recordEndOffset)
    KeyWordItemFBS.addKeyText(builder, keyTextOffset)
    KeyWordItemFBS.addKeyBlockIdx(builder, record.keyBlockIdx)
    return KeyWordItemFBS.endKeyWordItem(builder)
  })

  // 构建 KeyRecordList.records 列表
  const recordsVector = KeyWordItemListFBS.createItemsVector(
    builder,
    offsets
  )

  // 创建 KeyRecordList 对象
  KeyWordItemListFBS.startKeyWordItemList(builder)
  KeyWordItemListFBS.addItems(builder, recordsVector)
  const root = KeyWordItemListFBS.endKeyWordItemList(builder)
  builder.finish(root)

  return builder.asUint8Array() // Uint8Array，可直接保存或传输
}

/**
 * 反序列化 Uint8Array 为 KeyWordItem 数组
 * 使用 FlatBuffers 反序列化格式
 * @param {Uint8Array} data - 序列化后的数据
 * @returns {KeyWordItem[]} - 返回反序列化后的 KeyWordItem 数组
 */
function deserialize(data) {
  const buf = new flatbuffers.ByteBuffer(data)
  const obj = KeyWordItemListFBS.getRootAsKeyWordItemList(buf)

  const items = []
  for (let i = 0; i < obj.itemsLength(); i++) {
    const item = obj.items(i)
    items.push({
      keyText: item.keyText(),
      recordStartOffset: item.recordStartOffset(),
      recordEndOffset: item.recordEndOffset(),
      keyBlockIdx: item.keyBlockIdx(),
    })
  }
  return items
}

/**
 * 序列化 Mdict 对象为 Uint8Array
 * 使用 msgpack 序列化格式
 * @param {Mdict} dict - 词典对象
 * @returns {Uint8Array} - 返回序列化后的 Uint8Array
 */
function serializeDict(dict) {
  const keywordList = dict.keywordList
  const keywordListFBS = serialize(keywordList)
  const tempObj = {
    _headerStartOffset: dict._headerStartOffset,
    _headerEndOffset: dict._headerEndOffset,
    _keyHeaderStartOffset: dict._keyHeaderStartOffset,
    _keyHeaderEndOffset: dict._keyHeaderEndOffset,
    _keyBlockInfoStartOffset: dict._keyBlockInfoStartOffset,
    _keyBlockInfoEndOffset: dict._keyBlockInfoEndOffset,
    _keyBlockStartOffset: dict._keyBlockStartOffset,
    _keyBlockEndOffset: dict._keyBlockEndOffset,
    _recordHeaderStartOffset: dict._recordHeaderStartOffset,
    _recordHeaderEndOffset: dict._recordHeaderEndOffset,
    _recordInfoStartOffset: dict._recordInfoStartOffset,
    _recordInfoEndOffset: dict._recordInfoEndOffset,
    _recordBlockStartOffset: dict._recordBlockStartOffset,
    _recordBlockEndOffset: dict._recordBlockEndOffset,
    keyInfoList: dict.keyInfoList,
    recordInfoList: dict.recordInfoList,
    recordBlockDataList: dict.recordBlockDataList,
    header: dict.header,
    options: dict.options,
    keyHeader: dict.keyHeader,
    recordHeader: dict.recordHeader,
    meta: {
      fname: dict.meta.fname,
      passcode: dict.meta.passcode,
      ext: dict.meta.ext,
      version: dict.meta.version,
      numWidth: dict.meta.numWidth,
      encoding: dict.meta.encoding,
      encrypt: dict.meta.encrypt,
    },
    keywordListFBS: keywordListFBS,
  }
  const msgpackEncoded = encode(tempObj)
  return msgpackEncoded
}

/**
 *
 * @param {Uint8Array} data - 序列化后的 Uint8Array 数据
 * @returns {Mdict} - 返回反序列化后的 Mdict 对象
 */
function deserializeDict(data) {
  const tempObj = decode(data)
  const deserializedDict = Object.create(MDX.prototype)

  deserializedDict._headerStartOffset = tempObj._headerStartOffset
  deserializedDict._headerEndOffset = tempObj._headerEndOffset
  deserializedDict._keyHeaderStartOffset = tempObj._keyHeaderStartOffset
  deserializedDict._keyHeaderEndOffset = tempObj._keyHeaderEndOffset
  deserializedDict._keyBlockInfoStartOffset =
    tempObj._keyBlockInfoStartOffset
  deserializedDict._keyBlockInfoEndOffset = tempObj._keyBlockInfoEndOffset
  deserializedDict._keyBlockStartOffset = tempObj._keyBlockStartOffset
  deserializedDict._keyBlockEndOffset = tempObj._keyBlockEndOffset
  deserializedDict._recordHeaderStartOffset =
    tempObj._recordHeaderStartOffset
  deserializedDict._recordHeaderEndOffset = tempObj._recordHeaderEndOffset
  deserializedDict._recordInfoStartOffset = tempObj._recordInfoStartOffset
  deserializedDict._recordInfoEndOffset = tempObj._recordInfoEndOffset
  deserializedDict._recordBlockStartOffset =
    tempObj._recordBlockStartOffset
  deserializedDict._recordBlockEndOffset = tempObj._recordBlockEndOffset
  deserializedDict.keyInfoList = tempObj.keyInfoList
  deserializedDict.recordInfoList = tempObj.recordInfoList
  deserializedDict.recordBlockDataList = tempObj.recordBlockDataList
  deserializedDict.header = tempObj.header
  deserializedDict.options = tempObj.options
  deserializedDict.keyHeader = tempObj.keyHeader
  deserializedDict.recordHeader = tempObj.recordHeader
  deserializedDict.meta = {
    fname: tempObj.meta.fname,
    passcode: tempObj.meta.passcode,
    ext: tempObj.meta.ext,
    version: tempObj.meta.version,
    numWidth: tempObj.meta.numWidth,
    encoding: tempObj.meta.encoding,
    encrypt: tempObj.meta.encrypt,
  }
  deserializedDict.keywordList = deserialize(
    new Uint8Array(tempObj.keywordListFBS)
  )
  deserializedDict.scanner = new FileScanner(deserializedDict.meta.fname)
  deserializedDict.meta.decoder = new TextDecoder(
    deserializedDict.meta.encoding
  )
  return deserializedDict
}

module.exports = {
  serializeDict,
  deserializeDict,
}
