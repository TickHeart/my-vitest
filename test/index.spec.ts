import { describe, expect, it } from '../src/index'

it('default1', () => {
  expect(1).eq(1)
})

describe('describe1', () => {
  it('it1', () => {
    expect(1).eq(2)
  })

  it('it2', () => {
    expect(1).eq(1)
  })

  it.skip('it3', () => {
    expect(1).eq(4)
  })

  it.todo('it4 记得测试昂')
})

