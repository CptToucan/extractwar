import {expect, test} from '@oclif/test'

describe('parse-unit-cards', () => {
  test
  .stdout()
  .command(['parse-unit-cards'])
  .it('runs hello', ctx => {
    expect(ctx.stdout).to.contain('hello world')
  })

  test
  .stdout()
  .command(['parse-unit-cards', '--name', 'jeff'])
  .it('runs hello --name jeff', ctx => {
    expect(ctx.stdout).to.contain('hello jeff')
  })
})
