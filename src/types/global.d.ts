declare global {
  interface Window {
    services: {
      dicts: {
        searchDict(
          dictID: string,
          searchTerm: string
        ): Promise<{ word: unknown; definition: string | null }[]>
        addDict(
          dictID: string,
          originalDictFilePath: string
        ): Promise<void>
        removeDict(dictID: string): Promise<boolean>
      }
      files: {
        checksumFile(filePath: string): Promise<string>
        getBasenameWithoutExt(filePath: string): string
        existsSync(filePath: string): boolean
        isFile(filePath: string): boolean
      }
      trie: {
        init(): Promise<void>
        searchPrefix(
          searchTerm: string,
          limit: number = -1
        ): Promise<string[]>
        saveTrie(): Promise<boolean>
      }
    }
  }
}

export {} // 让该文件成为模块，避免全局污染
