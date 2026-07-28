import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { listModsFromPath } from '../../server/mods'

describe('listModsFromPath', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'varyon-mods-'))
    await writeFile(join(dir, 'Foo.jar'), 'x')
    await mkdir(join(dir, 'BarMod'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('lists jars and directories', async () => {
    const res = await listModsFromPath(dir)
    expect(res.path).toBe(dir)
    expect(res.mods.map((m) => m.name).sort()).toEqual(['BarMod', 'Foo.jar'])
  })
})
