import { parse } from 'acorn'
import { Scope } from './scope'
import { traverse, AstNode } from './traverse'
import { globalObj } from './global'

export function run(code: string, injectObj: any = {}, module: boolean = false) {
  const allInject = { ...globalObj, ...injectObj }

  const globalScope = new Scope()

  Object.getOwnPropertyNames(allInject).forEach(key => {
    globalScope.create('var', key, allInject[key])
  })

  if (module) {
    const $exports = {}
    const $module = { 'exports': $exports }
  
    globalScope.create('const', 'module', $module)
    globalScope.create('const', 'exports', $exports)
  
    const ast = parse(code) as AstNode
  
    traverse(ast, globalScope)

    const moduleObj = globalScope.query('module')
    return moduleObj.exports
  } else {
    const ast = parse(code) as AstNode
    return traverse(ast, globalScope)
  }
}
