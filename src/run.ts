import fg from 'fast-glob'
import c from 'picocolors'
import { context } from './context'
import { defaultSuite } from './suite'
import type { File, Suite, Task, TaskResult } from './types'
const { log } = console
export async function run() {
  const rootDir = process.cwd()

  const files = await fg(['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'], {
    cwd: rootDir,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**'],
  })

  for (const file of files)
    await runFile(file)
}
async function runFile(filepath: string) {
  const file = await parseFile(filepath)
  for (const [suite, tasks] of file.tasks) {
    let indent = 1
    if (suite.name) {
      log(suite.name)
      indent += 1
    }

    const result = await runTasks(tasks)
    for (const r of result) {
      if (r.error === undefined) {
        log(`${' '.repeat(indent * 2)}${c.inverse(c.green(' PASS '))} ${c.green(r.task.name)}`)
      }
      else {
        console.error(`${' '.repeat(indent * 2)}${c.inverse(c.red(' FAIL '))} ${c.red(r.task.name)}`)
        console.error(' '.repeat((indent + 2) * 2) + c.red(String(r.error)))
        process.exitCode = 1
      }
    }
    if (suite.name)
      indent -= 1
  }
}

export async function parseFile(filepath: string) {
  await import(filepath)
  const suites = [defaultSuite, ...context.suites]

  const tasks = await Promise.all(suites.map(async (suite) => {
    context.currentSuite = suite
    return [suite, await suite.collect()] as [Suite, Task[]]
  }))

  const file: File = {
    filepath,
    suites,
    tasks,
  }

  file.tasks.forEach(([, tasks]) =>
    tasks.forEach(task => task.file = file),
  )

  return file
}

async function runTasks(tasks: Task[]) {
  const results: TaskResult[] = []
  for (const task of tasks) {
    const result: TaskResult = { task }
    try {
      await task.fn()
    }
    catch (e) {
      result.error = e
    }
    results.push(result)
  }

  return results
}

