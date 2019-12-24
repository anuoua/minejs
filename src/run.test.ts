import { run } from './run'

describe('run方法测试', () => {
  it('随便run一个代码', () => {
    run(`var a = 'hello'`)
  })
})