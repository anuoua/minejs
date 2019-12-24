import { run } from './run'
import { readFileSync } from 'fs'

describe('代码运行测试', () => {
  it('变量初始化', () => {
    expect(run(`
      a = 1
      a
    `)).toBe(1)

    expect(run(`
      let a = 1
      a
    `)).toBe(1)

    expect(run(`
      const a = 2
      a
    `)).toBe(2)

    expect(run(`
      var a = 3
      a
    `)).toBe(3)

    expect(run(`
      var a = 3
      var b = a
      b
    `)).toBe(3)
  })

  it('变量赋值', () => {
    expect(run(`
      let a = 1
      a += 1
      a -= 1
      a *= 5
      a %= 3
      a /= 2
      a
    `)).toBe(1)


    expect(run(`
      var a = 1
      a += 1
      a -= 1
      a *= 5
      a %= 3
      a /= 2
      a
    `)).toBe(1)
  })

  it('逻辑操作符', () => {
    expect(run(`
      let a = 1
      let b = 0
      a && b
    `)).toBeFalsy

    expect(run(`
      let a = 1
      let b = 2
      a && b
    `)).toBeTruthy

    expect(run(`
      let a = 0
      let b = 5
      a || b
    `)).toBe(5)
  })

  it('一元操作符', () => {
    expect(run(`
      ~ + - ! void 1
    `)).toBe(0)

    expect(run(`
      typeof []
    `)).toBe('object')

    expect(run(`
      var a = {
        b: 1
      }
      delete a.b
      JSON.stringify(a)
    `)).toBe('{}')

    expect(() => {
      run(`
        ccc = 'ccc'
        function aaa() {
          delete ccc
        }
        aaa()
        ccc
      `)
    }).toThrowError('ccc is not defined')
  })

  it('三目语法', () => {
    expect(run(`
      let a = 1
      function aaa() {
        return 333
      }
      a === 3 ? 123 : aaa()
    `)).toBe(333)
  })

  it('对象变量初始化', () => {
    expect(run(`
      let a = {
        hello: {
          "hello": 'world!'
        }
      }
      a.hello['hello']
    `)).toBe('world!')
  })

  it('数组初始化', () => {
    expect(run(`
      let a = [1, 2]
      a[1]
    `)).toBe(2)
  })

  it('对象内嵌数组', () => {
    expect(run(`
      let a = {
        hello: ['1', 2, {
          hello: 'world!'
        }]
      }
      a.hello[2].hello
    `)).toBe('world!')
  })

  it('对象赋值', () => {
    expect(run(`
      let a = {
        2: {
          hello: '1'
        }
      }
      
      a[2].hello = 'world!!'
      a[2]['hello']
    `)).toBe('world!!')

    expect(run(`
      let a = {
        hello: 'world'
      }
      var c = 'dd'
      let b = {
        [c]: a
      }
      b[c].hello
    `)).toBe('world')

    expect(run(`
      let a = {
        hello: 'world'
      }
      let b = {
        c: a
      }
      b['c'].hello
    `)).toBe('world')

    expect(run(`
      let a = {
        c: {
          hello: ''
        }
      }
      a['c'].hello = 'world'
      a['c'].hello
    `)).toBe('world')
  })

  
  it('加减乘除等操作符', () => {
    expect(run(`
      let a = 1 + 1
      a -= 1
      a = a * 2
      a
    `)).toBe(2)
  })

  // it('变量提升', () => {
  //   expect(run(`
  //     var a = abc
  //     function abc() {
  //       return 'hello'
  //     }  
  //     a()
  //   `)).toBe('hello')
  // })

  it('函数内部的this', function (this: any) {
    const {run: run2} = run(`
      exports.run = function () {
        return Object.assign(arguments[0], arguments[1])
      }
    `, {}, true)
    expect(run2({}, { hello: 'world' })).toMatchObject({hello: 'world'})
  })

  it('函数arguments，和参数分离', () => {
    expect(run(`
      var r = this && this.__assign || function () {
        return Object.assign(arguments[0], arguments[1])
      };
      r({}, {})
    `)).toMatchObject({})
  })

  it('标签语法测试', () => {
    expect(run(`
      var str = "";

      loop1:
      for (var i = 0; i < 5; i++) {
        if (i === 1) {
          continue loop1;
        }
        str = str + i;
      }
      str
    `)).toBe('0234')

    expect(run(`
      var str = "";

      loop1:
      for (var i = 0; i < 5; i++) {
        if (i === 1) {
          break loop1;
        }
        str = str + i;
      }
      str
    `)).toBe('0')
  })
})

describe('if-else测试', () => {
  it('正常条件语句', () => {
    expect(run(`
      let i = 33333
      if (i === 2) {
        i = 9
      } else if (i === 0) {
        i = 10
      } else {
        i = 11
      }
    `)).toBe(11)
  })
})

describe('for循环测试', () => {
  it('正常循环', () => {
    expect(run(`
      let count
      count = 0
      for (let i = 0; i < 10; i++) {
        count = i
      }
      count
    `)).toBe(9)
  })

  it('for 循环带var变量', () => {
    expect(run(`
      for (var i = 0, n = []; i < 2; i++) {
        n.push(i)
      }
      n.length
    `)).toBe(2)
  })

  it('带条件语句', () => {
    expect(run(`
      let count
      count = 0
      for (let i = 0; i < 10; i++) {
        if (i === 4) {
          count = i
        }
      }
      count
    `)).toBe(4)
  })

  it('带continue语句', () => {
    expect(run(`
      let count
      count = 0
      for (let i = 0; i < 10; i++) {
        if (i % 2 !== 1) {
          continue
        } else {
          count++
        }
      }
      count
    `)).toBe(5)
  })

  it('带continue,break语句', () => {
    expect(run(`
      let count = 0
      for (let i = 0; i < 10; i++) {
        if (i % 2 !== 1) {
          continue
        } else if (i === 7) {
          break
        } else {
          count++
        }
      }
      count
    `)).toBe(3)
  })

  
  it('在函数内带continue,break语句', () => {
    expect(run(`
      function go() {
        let count = 0
        for (let i = 0; i < 10; i++) {
          if (i % 2 !== 1) {
            continue
          } else if (i === 7) {
            break
          } else {
            count++
          }
        }
        return count
      }
      go()
    `)).toBe(3)
  })

  
  it('在函数内带continue,return语句', () => {
    expect(run(`
      function go() {
        let count = 0
        for (let i = 0; i < 10; i++) {
          if (i % 2 !== 1) {
            continue
          } else if (i === 7) {
            return count
          } else {
            count++
          }
        }
      }
      go()
    `)).toBe(3)
  })

  
  it('switch语句', () => {
    expect(run(`
      var a = 0
      switch (a) {
        case 10, 3: a = 888;
        case 0: a = 333
      }
      a
    `)).toBe(333)
  })

  it('switch case', () => {
    expect(run(`
      var a = 0
      switch (a) {
        case 0: case 2:
          a = 34
          break
        case 4:
          a = 8
      }
      a
    `)).toBe(34)
  })

  it('switch语句带break', () => {
    expect(run(`
      var a = 0
      switch (a) {
        case 0, 3: a = 888; break;
        case 1: a = 333
      }
      a
    `)).toBe(0)
  })


  it('switch语句在函数内带return', () => {
    expect(run(`
      function abc() {
        var a = 3
        switch (a) {
          case 0, 3: a = 888; return a
        }
      }
      abc()
    `)).toBe(888)
  })

  
  it('测试switch嵌套在函数中，case中加入return', () => {
    expect(run(`
      function abc() {
        var a = 3
        switch (a) {
            case 3: a = 999;return a
            default: var c = 2222;
        }
      }
      abc()
    `)).toBe(999)
  })

  it('for-in循环', () => {
    expect(run(`
      let item
      var obj = { hello: 'world' }
      for (let i in obj) {
        item = i
      }
      item
    `)).toBe('hello')
  })
  
  it('do-while循环', () => {
    expect(run(`
      let a = 2
      do {
        a--
      } while(a>0)
      a
    `)).toBe(0)
  })

  it('while循环', () => {
    expect(run(`
      a = 3
      while(a > 0) {
        a--
      }
      a
    `)).toBe(0)
  })

  it('try catch', () => {
    expect(run(`
      function aa() {
        try {
          const i = 4
          i = 7
        } catch (err) {
          let i = 9
          return i
        }
      }
      aa()
    `)).toBe(9)
  })


  it('try catch 测试 抛出错误', () => {
    expect(run(`
      function aa() {
        try {
          const i = 4
          i = 7
        } catch (err) {
          return err
        }
      }
      aa().message
    `)).toBe('Assignment to constant variable.')
  })

  
  it('try catch 测试 finally', () => {
    expect(run(`
      try {
        const i = 4
        i = 33
      } catch (err) {
        const a = 1
      } finally {
        let aa = ''
        aa = 'ddd'
      }
    `)).toBe('ddd')
  })
})

it('代码自举测试', () => {
  const { run: run2 } = run(readFileSync('./dist/index.js').toString(), {}, true)

  run2(`console.log('自举成功！！！！')`)
})