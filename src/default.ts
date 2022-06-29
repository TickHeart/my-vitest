import { relative } from 'path'
import { performance } from 'perf_hooks'
import c from 'picocolors'
import ora from 'ora'
import type { File, Reporter, Suite, Task } from './types'

const DOT = '· '

export class DefaultReporter implements Reporter {
  indent = 0
  start = 0
  end = 0

  onStart() {
    this.indent = 0
  }

  onCollected() {
    this.start = performance.now()
  }

  onFileBegin(file: File) {
    this.log(`- ${relative(process.cwd(), file.filepath)} ${c.dim(`(${file.suites.flatMap(i => i.tasks).length} tests)`)}`)
  }

  onSuiteBegin(suite: Suite) {
    if (suite.name) {
      this.indent += 1
      const name = DOT + suite.name
      if (suite.mode === 'skip')
        this.log(c.dim(c.yellow(`${name} (skipped)`)))
      else if (suite.mode === 'todo')
        this.log(c.dim(`${name} (todo)`))
      else
        this.log(name)
    }
  }

  onTaskBegin(task: Task) {
    this.indent += 1

    task.__ora = ora({ text: task.name, prefixText: this.getIndent().slice(1), spinner: 'arc' }).start()
  }

  onTaskEnd(task: Task) {
    task.__ora?.stop()

    if (task.status === 'pass') {
      this.log(`${c.green(`✔ ${task.name}`)}`)
    }
    else if (task.status === 'skip') {
      this.log(c.dim(c.yellow(`${DOT + task.name} (skipped)`)))
    }
    else if (task.status === 'todo') {
      this.log(c.dim(`${DOT + task.name} (todo)`))
    }
    else {
      this.error(`${c.red(`⤫ ${c.inverse(c.red(' FAIL '))} ${task.name}`)}`)
      this.error(String(task.error), 1)
      process.exitCode = 1
    }
    this.indent -= 1
  }

  onSuiteEnd(suite: Suite) {
    if (suite.name)
      this.indent -= 1
  }

  onFileEnd() {
    this.log()
  }

  private log(msg = '', indentOffset = 0) {
    // eslint-disable-next-line no-console
    console.log(`${this.getIndent(indentOffset)}${msg}`)
  }

  private getIndent(offest = 0) {
    return ' '.repeat((this.indent + offest) * 2)
  }

  private error(msg = '', indentOffset = 0) {
    console.error(c.red(`${this.getIndent(indentOffset)}${msg}`))
  }
}
