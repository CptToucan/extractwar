import {expect, test} from '@oclif/test'

describe('dedupe-unit-cards', () => {
  test
  .stdout()
  .command(['dedupe-unit-cards'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['dedupe-unit-cards', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
