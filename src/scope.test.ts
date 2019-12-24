import { Scope } from './scope'

describe('单个scope', () => {
  let scope: Scope

  beforeEach(() => {
    scope = new Scope()
  })

  it('直接读取没有声明的变量', () => {
    expect(() => {
      scope.query('hello')
    }).toThrowError('hello is not defined')
  })

  it('变量声明', () => {
    scope.create('var', 'hello1', 1)
    scope.create('let', 'hello2', 2)
    scope.create('const', 'hello3', 3)
    expect(scope.query('hello1')).toBe(1)
    expect(scope.query('hello2')).toBe(2)
    expect(scope.query('hello3')).toBe(3)
  })

  it('变量重复声明', () => {
    // 测试var重复声明
    scope.create('var', 'hello', 'hello')
    scope.create('var', 'hello', 'world')
    expect(scope.query('hello')).toBe('world')
    scope.create('var', 'hello')
    // var hello = 'hello'; var hello = 'world'; var hello;
    expect(scope.query('hello')).toBe('world')
    // 测试let覆盖var
    expect(() => {
      scope.create('let', 'hello', 1)
    }).toThrowError(`Identifier 'hello' has already been declared`)
    // 测试const覆盖var
    expect(() => {
      scope.create('const', 'hello', 1)
    }).toThrowError(`Identifier 'hello' has already been declared`)
    // 测试let覆盖const
    expect(() => {
      scope.create('const', 'hello2', 1)
      scope.create('let', 'hello2', 1)
    }).toThrowError(`Identifier 'hello2' has already been declared`)
    // 测试const覆盖let
    expect(() => {
      scope.create('let', 'hello3', 1)
      scope.create('const', 'hello3', 1)
    }).toThrowError(`Identifier 'hello3' has already been declared`)
    // 测试var覆盖let
    expect(() => {
      scope.create('var', 'hello3', 1)
    }).toThrowError(`Identifier 'hello3' has already been declared`)
  })

  it('变量重新赋值', () => {
    // 给var变量重新赋值
    scope.create('var', 'hello', 'hello')
    scope.update('hello', 123)
    expect(scope.query('hello')).toBe(123)
    // 给let变量重新赋值
    scope.create('let', 'hello2', 'hello')
    scope.update('hello2', 123)
    expect(scope.query('hello2')).toBe(123)
    // 给const重新赋值
    scope.create('const', 'hello3', 'hello')
    expect(() => {
      scope.update('hello3', 123)
    }).toThrowError('Assignment to constant variable.')
  })
})

describe('多层scope测试', () => {
  let parentScope: Scope, scope: Scope

  beforeEach(() => {
    parentScope = new Scope()
    scope = new Scope(parentScope)
  })

  it('子scope取不存在的值', () => {
    expect(() => {
      scope.query('hello')
    }).toThrowError('hello is not defined')
  })

  it('两层scope测试', () => {
    const parentScope = new Scope()
    const scope = new Scope(parentScope)

    parentScope.create('let', 'hello', 'hello')
    expect(scope.query('hello')).toBe('hello')

    scope.update('hello', 'hello2')
    expect(parentScope.query('hello')).toBe('hello2')
    expect(scope.query('hello')).toBe('hello2')
  })

  it('子scope赋值父scope变量，const', () => {
    parentScope.create('const', 'hello', 'hello')
    expect(() => {
      scope.update('hello', 'hello2')
    }).toThrowError('Assignment to constant variable.')
  })

  it('子scope赋值父scope变量，let，var', () => {
    parentScope.create('let', 'hello', 'hello')
    scope.update('hello', 'hello2')
    expect(scope.query('hello')).toBe('hello2')
  })

  it('将变量配置成undefinde测试', () => {
    parentScope.create('let', 'hello', 'hello')
    scope.update('hello', undefined)
    expect(parentScope.query('hello')).toBeUndefined()
    scope.create('let', 'hello', 'hello')
    scope.update('hello', undefined)
    expect(scope.query('hello')).toBeUndefined()
  })
})