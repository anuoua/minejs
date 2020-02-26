# mine-js

一个ts实现的js解释器

## 安装

```bash
$ npm install mine-js
```

## 使用方法

```javascript
import { run } from 'mine-js'

run(code, options)
```

直接跑代码

```javascript
import { run } from 'mine-js'
run(`console.log("hello world!")`)
// hello world!
```

直接跑ast节点
```javascript
import { run } from 'mine-js'
run(
{
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
            "value": "hello world!",
            "raw": "'hello world!'"
          }
        ]
      }
    }
  ],
  "sourceType": "module"
}
)

// hello world!
```

参数选项

`options.injectObj`: 通过这个对象可以将外部变量注入到内部代码

例子:

```javascript
import { run } from 'mine-js'
const str = 'hello'
run(`console.log(hello + ' world')`, { hello: str })
// hello world
```

`options.module`: 按照module的方式运行code，运行后会返回内部代码export的变量

例子：

```javascript
import { run } from 'mine-js'
run(`
exports.hello = 'hello'
`)
// { hello: 'hello' }
```
