

export type TKind = 'var' | 'const' | 'let'
export type TStoreKey = 'varStore' | 'letStore' | 'constStore'

interface IStore extends Object {
  [index: string]: any
}

export class Scope {
  varStore: IStore = {}
  letStore: IStore = {}
  constStore: IStore = {}

  constructor(public parentScope?: Scope) {}

  create(kind: TKind, key: string, value?: any) {
    const { varStore } = this
    const result = this.findVariable(key)
    if (result !== undefined) {
      if (kind === 'var' && varStore.hasOwnProperty(key)) {
        const kindStr = kind + 'Store' as TStoreKey
        value !== undefined && (this[kindStr][key] = value)
      } else {
        throw new Error(`Identifier '${key}' has already been declared`)
      }
    } else {
      const kindStr = kind + 'Store' as TStoreKey
      this[kindStr][key] = value
    }
  }

  query(key: string): any {
    const result = this.findVariable(key)
    if (result !== undefined) {
      return result[1]
    } else {
      if (this.parentScope) {
        return this.parentScope.query(key)
      } else {
        throw new Error(`${key} is not defined`)
      }
    }
  }

  update(key: string, value: any) {
    const { varStore, letStore, constStore } = this
    const result = this.findVariable(key)
    if (result !== undefined) {
      if (constStore.hasOwnProperty(key)) {
        throw new Error(`Assignment to constant variable.`)
      }
      if (varStore.hasOwnProperty(key)) {
        varStore[key] = value
      } else if (letStore.hasOwnProperty(key)) {
        letStore[key] = value
      }
    } else {
      if (this.parentScope) {
        this.parentScope.update(key, value)
      } else {
        varStore[key] = value
      }
    }
  }

  delete(key: string): boolean {
    const { varStore, letStore, constStore } = this
    if (this.parentScope) {
      return this.parentScope.delete(key)
    } else {
      if (varStore.hasOwnProperty(key)) {
        return delete varStore[key]
      } else if (letStore.hasOwnProperty(key) || constStore.hasOwnProperty(key)) {
        return false
      } else {
        return true
      }
    }
  }

  private findVariable(key: string) {
    const { varStore, letStore, constStore } = this
    return Object.entries({ ...varStore, ...letStore, ...constStore }).find(([storeKey]) => key === storeKey)
  }
}
