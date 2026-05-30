import fs from 'fs'
import path from 'path'

const LOG_FILE = path.join(process.cwd(), 'logs', 'app.log')

function write(line: string): void {
  try {
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8')
  } catch {
    // Silent fail — logging must never crash the server
  }
}

function format(level: string, context: string, message: string, data?: unknown): string {
  const ts      = new Date().toISOString()
  const lvl     = level.padEnd(5)
  const dataStr = data !== undefined ? '  ' + JSON.stringify(data, null, 0) : ''
  return `[${ts}] ${lvl} [${context}]  ${message}${dataStr}`
}

export const logger = {
  info(context: string, message: string, data?: unknown): void {
    const line = format('INFO',  context, message, data)
    write(line)
    console.log(line)
  },
  warn(context: string, message: string, data?: unknown): void {
    const line = format('WARN',  context, message, data)
    write(line)
    console.warn(line)
  },
  error(context: string, message: string, data?: unknown): void {
    const line = format('ERROR', context, message, data)
    write(line)
    console.error(line)
  },
}
