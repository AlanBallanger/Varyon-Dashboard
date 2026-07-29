import { open } from 'node:fs/promises'
import type { AppEnv } from './env'

const MAX_COMMAND_LENGTH = 2000

export async function sendConsoleCommand(env: AppEnv, command: string): Promise<void> {
  const trimmed = command.replace(/[\r\n]+/g, ' ').trim()
  if (!trimmed) {
    throw new Error('Command is empty')
  }
  if (trimmed.length > MAX_COMMAND_LENGTH) {
    throw new Error(`Command too long (max ${MAX_COMMAND_LENGTH} chars)`)
  }

  let handle
  try {
    handle = await open(env.consoleFifoPath, 'w')
  } catch (e) {
    throw new Error(
      `Cannot open console pipe at ${env.consoleFifoPath}: ${e instanceof Error ? e.message : String(e)}`,
    )
  }
  try {
    await handle.write(`${trimmed}\n`)
  } finally {
    await handle.close()
  }
}
