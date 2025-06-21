import * as flatbuffers from 'flatbuffers';
export declare class KeyWordItem {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): KeyWordItem;
    static getRootAsKeyWordItem(bb: flatbuffers.ByteBuffer, obj?: KeyWordItem): KeyWordItem;
    static getSizePrefixedRootAsKeyWordItem(bb: flatbuffers.ByteBuffer, obj?: KeyWordItem): KeyWordItem;
    recordStartOffset(): number;
    recordEndOffset(): number;
    keyText(): string | null;
    keyText(optionalEncoding: flatbuffers.Encoding): string | Uint8Array | null;
    keyBlockIdx(): number;
    static startKeyWordItem(builder: flatbuffers.Builder): void;
    static addRecordStartOffset(builder: flatbuffers.Builder, recordStartOffset: number): void;
    static addRecordEndOffset(builder: flatbuffers.Builder, recordEndOffset: number): void;
    static addKeyText(builder: flatbuffers.Builder, keyTextOffset: flatbuffers.Offset): void;
    static addKeyBlockIdx(builder: flatbuffers.Builder, keyBlockIdx: number): void;
    static endKeyWordItem(builder: flatbuffers.Builder): flatbuffers.Offset;
    static createKeyWordItem(builder: flatbuffers.Builder, recordStartOffset: number, recordEndOffset: number, keyTextOffset: flatbuffers.Offset, keyBlockIdx: number): flatbuffers.Offset;
}
