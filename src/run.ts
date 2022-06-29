import fg from 'fast-glob'
import { context } from './context'
import { DefaultReporter } from './default'
import { clearContext, defaultSuite } from './suite'
import type { File, Reporter, RunnerContext, Suite, Task } from './types'

export async function run() {
  const rootDir = process.cwd()

  const paths = await fg(['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'], {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**'],
  })

  const reporter: Reporter = new DefaultReporter()
  reporter.onStart({})

  const files = await collectFiles(paths)

  const ctx: RunnerContext = {
    files,
    mode: isOnlyMode(files) ? 'only' : 'all',
    userOptions: {},
    reporter,
  }

  await reporter.onCollected?.(ctx)

  for (const file of files)
    await runFile(file, ctx)
}

async function collectFiles(paths: string[]) {
  const result: File[] = []

  for (const filepath of paths) {
    clearContext()
    await import(filepath)
    const collectors = [defaultSuite, ...context.suites]

    const suites: Suite[] = []

    const file: File = {
      filepath,
      suites: [],
    }

    for (const c of collectors) {
      // 执行 describe 里面所有的 test 收集测试用例
      context.currentSuite = c
      suites.push(await c.collect(file))
    }

    file.suites = suites

    result.push(file)
  }

  return result
}

function isOnlyMode(files: File[]) {
  return !!files.find(
    file => file.suites.find(
      suite => suite.mode === 'only' || suite.tasks.find(t => t.mode === 'only'),
    ),
  )
}

async function runFile(file: File, ctx: RunnerContext) {
  const { reporter } = ctx

  await reporter.onFileBegin?.(file, ctx)
  for (const suite of file.suites) {
    await reporter.onSuiteBegin?.(suite, ctx)

    for (const t of suite.tasks)
      await runTask(t, ctx)
    await reporter.onSuiteEnd?.(suite, ctx)
  }
  await reporter.onFileEnd?.(file, ctx)
}

async function runTask(task: Task, ctx: RunnerContext) {
  const { reporter } = ctx
  await reporter.onTaskBegin?.(task, ctx)

  if (task.suite.mode === 'skip' || task.mode === 'skip') {
    task.status = 'skip'
  }
  else if (task.suite.mode === 'todo' || task.mode === 'todo') {
    task.status = 'todo'
  }
  else {
    try {
      await task.fn()
      task.status = 'pass'
    }
    catch (e) {
      task.status = 'fail'
      task.error = e
    }
  }

  await reporter.onTaskEnd?.(task, ctx)
}

