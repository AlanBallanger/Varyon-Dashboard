import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { AppEnv } from './env'
import type { ModInfo, ModsResponse } from './types'

export async function listModsFromPath(modsPath: string): Promise<ModsResponse> {
  const entries = await readdir(modsPath, { withFileTypes: true })
  const mods: ModInfo[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const full = join(modsPath, entry.name)
    if (entry.isDirectory()) {
      mods.push({ name: entry.name, path: full, kind: 'directory' })
      continue
    }
    if (entry.isFile()) {
      const s = await stat(full)
      mods.push({ name: entry.name, path: full, kind: 'file', sizeBytes: s.size })
    }
  }
  mods.sort((a, b) => a.name.localeCompare(b.name))
  return { mods, path: modsPath }
}

export async function listMods(env: AppEnv): Promise<ModsResponse> {
  return listModsFromPath(env.modsPath)
}
