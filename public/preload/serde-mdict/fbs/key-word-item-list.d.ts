import * as flatbuffers from 'flatbuffers';
import { KeyWordItem } from './key-word-item';
export declare class KeyWordItemList {
    bb: flatbuffers.ByteBuffer | null;
    bb_pos: number;
    __init(i: number, bb: flatbuffers.ByteBuffer): KeyWordItemList;
    static getRootAsKeyWordItemList(bb: flatbuffers.ByteBuffer, obj?: KeyWordItemList): KeyWordItemList;
    static getSizePrefixedRootAsKeyWordItemList(bb: flatbuffers.ByteBuffer, obj?: KeyWordItemList): KeyWordItemList;
    items(index: number, obj?: KeyWordItem): KeyWordItem | null;
    itemsLength(): number;
    static startKeyWordItemList(builder: flatbuffers.Builder): void;
    static addItems(builder: flatbuffers.Builder, itemsOffset: flatbuffers.Offset): void;
    static createItemsVector(builder: flatbuffers.Builder, data: flatbuffers.Offset[]): flatbuffers.Offset;
    static startItemsVector(builder: flatbuffers.Builder, numElems: number): void;
    static endKeyWordItemList(builder: flatbuffers.Builder): flatbuffers.Offset;
    static finishKeyWordItemListBuffer(builder: flatbuffers.Builder, offset: flatbuffers.Offset): void;
    static finishSizePrefixedKeyWordItemListBuffer(builder: flatbuffers.Builder, offset: flatbuffers.Offset): void;
    static createKeyWordItemList(builder: flatbuffers.Builder, itemsOffset: flatbuffers.Offset): flatbuffers.Offset;
}
