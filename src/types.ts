export interface Options {
  rootDir?: string
  includes?: string[]
  excludes?: string[]
  updateSnapshot?: boolean
}

export type TaskStatus = 'init' | 'pass' | 'fail' | 'skip' | 'todo'

export interface Task {
  __ora?: any
  name: string
  mode: RunMode
  suite: Suite
  fn: () => Awaitable<void>
  file?: File
  status: TaskStatus
  error?: unknown
}

export interface TaskResult {
  task: Task
  error?: unknown
}

export interface Suite {
  name: string
  mode: RunMode
  tasks: Task[]
  file?: File
}

export interface TestCollector {
  (name: string, fn: TestFunction): void
  only: (name: string, fn: TestFunction) => void
  skip: (name: string, fn: TestFunction) => void
  todo: (name: string) => void
}
export interface SuiteCollector {
  name: string
  mode: RunMode
  test: TestCollector
  collect: (file?: File) => Promise<Suite>
  clear: () => void
}

export type TestFunction = () => Awaitable<void>
export type Awaitable<T> = Promise<T> | T
export type TestFactory = (test: (name: string, fn: TestFunction) => void) => Awaitable<void>

export interface File {
  filepath: string
  suites: Suite[]
}

export interface GlobalContext {
  suites: SuiteCollector[]
  currentSuite: SuiteCollector | null
}

export type RunMode = 'run' | 'skip' | 'only' | 'todo'

export interface Reporter {
  onStart: (userOptions: Options) => Awaitable<void>
  onCollected?: (ctx: RunnerContext) => Awaitable<void>
  onFinished?: (ctx: RunnerContext) => Awaitable<void>

  onSuiteBegin?: (suite: Suite, ctx: RunnerContext) => Awaitable<void>
  onSuiteEnd?: (suite: Suite, ctx: RunnerContext) => Awaitable<void>
  onFileBegin?: (file: File, ctx: RunnerContext) => Awaitable<void>
  onFileEnd?: (file: File, ctx: RunnerContext) => Awaitable<void>
  onTaskBegin?: (task: Task, ctx: RunnerContext) => Awaitable<void>
  onTaskEnd?: (task: Task, ctx: RunnerContext) => Awaitable<void>

  // TODO:
  onSnapshotUpdate?: () => Awaitable<void>
}
export interface RunnerContext {
  files: File[]
  mode: 'all' | 'only'
  userOptions: Options
  reporter: Reporter
}
