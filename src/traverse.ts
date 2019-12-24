import { Scope, TKind } from './scope'
import EsTree, { Identifier } from 'estree'

export type AstNode = EsTree.Node | EsTree.Statement | EsTree.Declaration | EsTree.Expression | EsTree.Pattern

const RETURN = Symbol('return')
const BREAK = Symbol('break')
const CONTINUE = Symbol('continue')
const LABELED = Symbol('labeled')

class Interrupt {
  constructor(
    public type: Symbol,
    public data?: any,
    public label?: string
  ) {}
}

const NodeMap: any = {
  Program(node: EsTree.Program, scope: Scope) {
    return NodeMap.BlockStatement(node, scope)
  },

  VariableDeclaration(node: EsTree.VariableDeclaration, scope: Scope, extraInit: any) {
    node.declarations.forEach((declarator) => traverse(declarator, scope, node.kind, extraInit))
  },

  VariableDeclarator(node: EsTree.VariableDeclarator, scope: Scope, kind: TKind, extraInit: any) {
    if (node.id.type === 'Identifier') {
      scope.create(
        kind,
        node.id.name,
        node.init ? traverse(node.init, scope, node.id.name) : extraInit // node.id.name 函数名称需要用到
      )
    } else {
      throw new Error(`VariableDeclarator 内还未支持 ${node.id.type} 类型`)
    }
  },

  FunctionDeclaration(node: EsTree.FunctionDeclaration, scope: Scope) {
    if (!node.id) {
      throw new Error('FunctionDeclaration node.id 不存在')
    } else {
      scope.create('var', node.id.name, NodeMap._createFunction(node, scope))
    }
  },

  _createFunction(node: EsTree.FunctionDeclaration, scope: Scope) {
    const { params, body, id } = node

    function newFunction(this: any, ...rest: any[]) {
      const fnBodyScope = new Scope(scope)
      fnBodyScope.create('const', 'this', this)
      fnBodyScope.create('var', 'arguments', arguments)
      params.forEach((param, index) => {
        if (param.type === 'Identifier') {
          fnBodyScope.create('let', param.name, rest[index])
        } else {
          throw new Error('param.type 出现未知类型')
        }
      })
      const result = traverse(body, fnBodyScope)
      if (result instanceof Interrupt && result.type === RETURN) {
        return result.data
      } else {
        return undefined
      }
    }

    Object.defineProperty(newFunction, 'name', { value: id ? id.name : '' })

    return newFunction
  },

  ExpressionStatement(node: EsTree.ExpressionStatement, scope: Scope) {
    return traverse(node.expression, scope)
  },

  ContinueStatement(node: EsTree.ContinueStatement, scope: Scope) {
    return new Interrupt(CONTINUE, undefined, node.label ? node.label.name : undefined)
  },

  BreakStatement(node: EsTree.BreakStatement, scope: Scope, data?: any) {
    return new Interrupt(BREAK, undefined, node.label ? node.label.name : undefined)
  },

  SwitchStatement(node: EsTree.SwitchStatement, scope: Scope) {
    const discriminant = traverse(node.discriminant, scope)
    const switchScope = new Scope(scope)

    let matched = false

    for (const kase of node.cases) {
      if (!matched && (!kase.test || discriminant === traverse(kase.test, switchScope))) {
        matched = true
      }
      if (matched) {
        const result = traverse(kase, switchScope)
        if (result instanceof Interrupt) { 
          if (result.type === BREAK && !result.label) {
            break
          } else {
            return result
          }
        }
      }
    }
  },

  SwitchCase(node: EsTree.SwitchCase, scope: Scope) {
    for (let conseq of node.consequent) {
      const result = traverse(conseq, scope)
      if (result instanceof Interrupt) { return result }
    }
  },

  ForInStatement: (node: EsTree.ForInStatement, scope: Scope) => {

    const kind = (<EsTree.VariableDeclaration>node.left).kind
    const decl = (<EsTree.VariableDeclaration>node.left).declarations[0]
    const name = (<EsTree.Identifier>decl.id).name

    for (const value in traverse(node.right, scope)) {
        const new_scope = new Scope(scope)
        scope.create(kind, name, value)
        const result = traverse(node.body, new_scope)
        if (result instanceof Interrupt) {
          if (result.type === BREAK) { break }
          else if (result.type === CONTINUE) { continue }
          else if (result.type === RETURN) { return result }
        }
    }
  },

  // ForInStatement(node: EsTree.ForInStatement, scope: Scope) {
  //   const { left, right, body} = node
  //   const obj = traverse(right, scope)
  //   const forInScope = new Scope(scope)
  //   let last

  //   // traverse(left, forInScope)

  //   for (let key in obj) {
  //     traverse(left, forInScope, obj[key])
  //     const forInBodyScope = new Scope(forInScope)
  //     const result = traverse(body, forInBodyScope)
      
  //     if (result instanceof Interrupt) {
  //       if (result.type === CONTINUE) {
  //         continue
  //       } else if (result.type === BREAK) {
  //         return result.data
  //       } else if (result.type === RETURN) {
  //         return result
  //       }
  //     } else {
  //       last = result
  //     }
  //   }

  //   return last
  // },

  SequenceExpression(node: EsTree.SequenceExpression, scope: Scope) {
    return node.expressions.map(expression => traverse(expression, scope)).pop()
  },

  FunctionExpression(node: EsTree.FunctionExpression, scope: Scope, fnName: string) {
    const fn = NodeMap._createFunction(node, scope)
    Object.defineProperty(fn, 'name', { value: fnName || '' })
    return fn
  },

  AssignmentExpression(node: EsTree.AssignmentExpression, scope: Scope) {
    let { left, right, operator } = node

    let assignObj: Scope | any
    let property: string
    let operateValue: string | any
    let value

    const operatorMap: any = {
      '=': (a: any, b: any) => b,
      '+=': (a: any, b: any) => a + b,
      '-=': (a: any, b: any) => a - b,
      '*=': (a: any, b: any) => a * b,
      '/=': (a: any, b: any) => a / b,
      '%=': (a: any, b: any) => a % b,
      '**=': (a: any, b: any) => a **= b,
      '<<=': (a: any, b: any) => a << b,
      '>>=': (a: any, b: any) => a >> b,
      '>>>=': (a: any, b: any) => a >>> b,
      '|=': (a: any, b: any) => a | b,
      '^=': (a: any, b: any) => a ^ b,
      '&=': (a: any, b: any) => a & b,
    }

    operateValue = traverse(right, scope)

    if (left.type === 'Identifier') {
      assignObj = scope
      property = left.name
      value = operatorMap[operator](
        operator !== '=' && assignObj.query(property),
        operateValue
      )
      assignObj.update(property, value)
    } else {
      left = left as EsTree.MemberExpression
      assignObj = traverse(left.object, scope)
      if (!left.computed && left.property.type === 'Identifier') {
        property = left.property.name
      } else {
        property = traverse(left.property, scope)
      }
      value = operatorMap[operator](assignObj[property], operateValue)
      assignObj[property] = value
    }

    return value
  },

  BlockStatement(node: EsTree.BlockStatement, scope: Scope, label?: string) {
    const declarationNodes: AstNode[] = []
    const otherStatementNodes: AstNode[] = []

    node.body.forEach(item => {
      if (item.type === 'FunctionDeclaration') {
        declarationNodes.push(item)
      } else {
        otherStatementNodes.push(item)
      }
    })

    // 块作用域返回值
    let last

    for (let program of declarationNodes.concat(otherStatementNodes)) {
      const result = traverse(program, scope, label)

      if (result instanceof Interrupt) {
        return result
      } else {
        last = result
      }
    }

    return last
  },

  ConditionalExpression: (node: EsTree.ConditionalExpression, scope: Scope) => {
    const { test, consequent, alternate } = node
    return traverse(test, scope) ? traverse(consequent, scope) : traverse(alternate, scope)
  },

  BinaryExpression: (node: EsTree.BinaryExpression, scope: Scope) => {
    const { operator, left, right } = node

    const leftValue = traverse(left, scope)
    const rightValue = traverse(right, scope)

    const operatorMap: any = {
      '==': () => leftValue == rightValue,
      '!=': () => leftValue != rightValue,
      '===': () => leftValue === rightValue,
      '!==': () => leftValue !== rightValue,
      '<': () => leftValue < rightValue,
      '<=': () => leftValue <= rightValue,
      '>': () => leftValue > rightValue,
      '>=': () => leftValue >= rightValue,
      '<<': () => leftValue << rightValue,
      '>>': () => leftValue >> rightValue,
      '>>>': () => leftValue >>> rightValue,
      '+': () => leftValue + rightValue,
      '-': () => leftValue - rightValue,
      '*': () => leftValue * rightValue,
      '/': () => leftValue / rightValue,
      '%': () => leftValue % rightValue,
      '|': () => leftValue | rightValue,
      '^': () => leftValue ^ rightValue,
      '&': () => leftValue & rightValue,
      'in': () => leftValue in rightValue,
      'instanceof': () => leftValue instanceof rightValue,
    }

    return operatorMap[operator]()
  },

  UnaryExpression(node: EsTree.UnaryExpression, scope: Scope) {
    const { operator, prefix, argument } = node

    if (!prefix) {
      throw new Error('UnaryExpression中prefix为false的情况需要处理一下')
    }

    switch (operator) {
      case '-': return - traverse(argument, scope)
      case '+': return + traverse(argument, scope)
      case '!': return ! traverse(argument, scope)
      case '~': return ~ traverse(argument, scope)
      case 'void': return void traverse(argument, scope)
      case 'typeof':
        if (argument.type === 'Identifier' && !scope.query(argument.name)) {
          return 'undefined'
        } else {
          return typeof traverse(argument, scope)
        }
      case 'delete':
        if (argument.type === 'MemberExpression') {
          const { object, property } = argument
          const obj = traverse(object, scope)
          if (property.type === 'Identifier') {
            return delete obj[property.name]
          } else {
            return delete obj[traverse(property, scope)]
          }
        } else if (argument.type === 'Identifier') {
          scope.delete(argument.name)
        } else {
          // delete默认返回值
          return true
        }
    }
  },

  ReturnStatement(node: EsTree.ReturnStatement, scope: Scope) {
    return new Interrupt(RETURN, !node.argument ? undefined : traverse(node.argument, scope))
  },

  IfStatement(node: EsTree.IfStatement, scope: Scope) {
    const { test, consequent, alternate } = node
    if (traverse(test, scope)) {
      return traverse(consequent, scope)
    } else if (alternate) {
      return traverse(alternate, scope)
    } else {
    // 啥都不做
    }
  },

  DoWhileStatement(node: EsTree.DoWhileStatement, scope: Scope) {
    do {
      const doWhileScope = new Scope(scope)
      const result = traverse(node.body, doWhileScope)
      if (result instanceof Interrupt) {
        if (result.type === CONTINUE) { continue }
        else if (result.type === BREAK) { break }
        else if (result.type === RETURN) { return result }
      }
    } while(traverse(node.test, scope))
  },

  ForStatement(node: EsTree.ForStatement, scope: Scope) {
    const { init, test, update, body } = node
    const forScope = new Scope(scope)
    for (
      init && traverse(init, init.type === 'VariableDeclaration' && init.kind === 'var' ? scope : forScope);
      test ? traverse(test as EsTree.MemberExpression, forScope) : true;
      update && traverse(update, forScope)
    ) {
      const forBodyScope = new Scope(forScope)
      const result = traverse(body, forBodyScope)
      if (result instanceof Interrupt) {
        if (result.type === CONTINUE) { continue}
        else if (result.type === BREAK) { break }
        else if (result.type === RETURN) { return result }
      }
    }
  },

  LabeledStatement(node: EsTree.LabeledStatement, scope:Scope) {
    return traverse(node.body, scope, node.label.name)
  },

  WhileStatement(node: EsTree.WhileStatement, scope: Scope, label?: string) {
    while(traverse(node.test, scope)) {
      const whileScope = new Scope(scope)
      const result = traverse(node.body, whileScope)
      if (result instanceof Interrupt) {
        if (result.type === CONTINUE) {
          if (result.label && result.label !== label) { return result }
          else { continue }
        } else if (result.type === BREAK) {
          if (result.label && result.label !== label) { return result }
          else { break }
        } else if (result.type === RETURN) { return result }
      }
    }
  },

  TryStatement(node: EsTree.TryStatement, scope: Scope) {
    const { block, handler, finalizer } = node
    let result

    try {
      const blockScope = new Scope(scope)
      result = traverse(block, blockScope)
    } catch (err) {
      if (handler) {
        const handlerScope = new Scope(scope)
        result = traverse(handler, handlerScope, err)
      }
    }

    if (finalizer) {
      const finalizerScope = new Scope(scope)
      result = traverse(finalizer, finalizerScope)
    }

    return result
  },

  CatchClause(node: EsTree.CatchClause, scope: Scope, err: Error) {
    const { param, body } = node
    if (param.type === 'Identifier') {
      scope.create('let', param.name, err)
    } else {
      throw new Error(`CatchClause param.type: ${param.type} 未做处理`)
    }
    return traverse(body, scope)
  },

  EmptyStatement() {
    // 单冒号，啥都不干
  },

  ThrowStatement(node: EsTree.ThrowStatement, scope: Scope) {
    throw traverse(node.argument, scope)
  },

  UpdateExpression: (node: EsTree.UpdateExpression, scope: Scope) => {
    const { prefix, operator, argument } = node
    let obj, key

    if (argument.type === 'Identifier') {
      obj = scope
      key = argument.name
      switch (operator) {
        case '++': {
          const old = obj.query(key)
          obj.update(key, old + 1)
          return prefix ? old + 1 : old
        }
        case '--': {
          const old = obj.query(key)
          obj.update(key, old - 1)
          return prefix ? old - 1 : old
        }
      }
    } else if (argument.type === 'MemberExpression') {
      obj = traverse(argument.object, scope)
      if (!argument.computed && argument.property.type === 'Identifier') {
        key = argument.property.name
      } else {
        key = traverse(argument.property, scope)
      }
      switch (operator) {
        case '++':
          return prefix ? ++obj[key] : obj[key]++
        case '--':
          return prefix ? --obj[key] : obj[key]--
      }
    } else {
      throw new Error(`UpdateExpression argument.type: ${argument.type} 未处理`)
    }
  },

  ObjectExpression(node: EsTree.ObjectExpression, scope: Scope) {
    const obj: any = {}
    node.properties.forEach(propertyNode => {
      let { computed, key, value } = propertyNode
      if (computed) {
        obj[traverse(key, scope)] = traverse(value, scope, key.type === 'Identifier' ? key.name : undefined)
      } else {
        if (key.type === 'Literal') {
          obj[key.value as string] = traverse(value, scope, key.value)
        } else if (key.type === 'Identifier') {
          key = key as Identifier
          obj[key.name] = traverse(value, scope, key.name)
        }
      }
    })
    return obj
  },

  CallExpression(node: EsTree.CallExpression, scope: Scope) {
    const func = traverse(node.callee, scope)
    const args = node.arguments.map(arg => traverse(arg, scope))

    if (node.callee.type === 'MemberExpression') {
        const object = traverse(node.callee.object, scope)
        return func.apply(object, args)
    } else {
        const this_val = scope.query('this')
        return func.apply(this_val ? this_val : null, args)
    }
  },

  ArrayExpression(node: EsTree.ArrayExpression, scope: Scope) {
    return [
      ...node.elements.map(element => traverse(element, scope))
    ]
  },

  LogicalExpression(node: EsTree.LogicalExpression, scope: Scope) {
    const { left, operator, right} = node
    switch (operator) {
      case '||': return traverse(left, scope) || traverse(right, scope)
      case '&&': return traverse(left, scope) && traverse(right, scope)
    }
  },

  MemberExpression(node: EsTree.MemberExpression, scope: Scope) {
    let { computed, object, property } = node

    if (computed) {
      return traverse(object, scope)[traverse(property, scope)]
    } else {
      property = property as EsTree.Identifier
      return traverse(object, scope)[property.name]
    }
  },

  NewExpression(node: EsTree.NewExpression, scope: Scope) {
    const func = traverse(node.callee, scope)
    const args = node.arguments.map(arg => traverse(arg, scope))
    return new (func.bind.apply(func, [null].concat(args)))
  },
  
  ThisExpression(node: EsTree.ThisExpression, scope: Scope) {
    return scope.query('this')
  },

  Identifier(node: EsTree.Identifier, scope: Scope) {
    return scope.query(node.name)
  },

  Literal(node: EsTree.Literal, scope: Scope) {
    return node.value
  }
}

export const traverse = (node: AstNode, scope: Scope, ...rest: any[]) => {
  if (!node) {
    throw new Error('空节点，请做判断')
  }
  if (!NodeMap[node.type]) {
    throw new Error(`${node.type} 无对应解析方法`)
  }
  return NodeMap[node.type](node, scope, ...rest)
}
