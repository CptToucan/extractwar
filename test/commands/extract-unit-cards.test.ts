import {expect, test} from '@oclif/test'

describe('extract-unit-cards', () => {
  test
  .stdout()
  .command(['extract-unit-cards'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['extract-unit-cards', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
