import { parse } from 'acorn'
import { Scope } from './scope'
import { traverse, AstNode } from './traverse'
import { globalObj } from './global'

export function run(
  code: string | {},
  { injectObj = {} as any, module = false } = {}
) {
  const allInject = { ...globalObj, ...injectObj }

  const globalScope = new Scope()

  Object.getOwnPropertyNames(allInject).forEach(key => {
    globalScope.create('var', key, allInject[key])
  })

  let ast
  if (typeof code === 'string') {
    ast = parse(code) as AstNode
  } else {
    ast = code as AstNode
  }

  if (module) {
    const $exports = {}
    const $module = { 'exports': $exports }
  
    globalScope.create('const', 'module', $module)
    globalScope.create('const', 'exports', $exports)
  
    traverse(ast, globalScope)

    const moduleObj = globalScope.query('module')
    return moduleObj.exports
  } else {
    return traverse(ast, globalScope)
  }
}
