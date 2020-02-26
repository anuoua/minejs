import { run } from './run'

describe('run方法测试', () => {
  it('随便run一个代码', () => {
    run(`var a = 'hello'`)
  })

  it('随便跑一个ast节点', () => {
    run({
      "type": "Program",
      "start": 0,
      "end": 26,
      "body": [
        {
          "type": "ExpressionStatement",
          "start": 0,
          "end": 26,
          "expression": {
            "type": "CallExpression",
            "start": 0,
            "end": 26,
            "callee": {
              "type": "MemberExpression",
              "start": 0,
              "end": 11,
              "object": {
                "type": "Identifier",
                "start": 0,
                "end": 7,
                "name": "console"
              },
              "property": {
                "type": "Identifier",
                "start": 8,
                "end": 11,
                "name": "log"
              },
              "computed": false
            },
            "arguments": [
              {
                "type": "Literal",
                "start": 12,
                "end": 25,
                "value": "hello world",
                "raw": "'hello world'"
              }
            ]
          }
        }
      ],
      "sourceType": "module"
    })
  })
})