// SPDX-License-Identifier: AGPL-3.0-or-later
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url)
      const p = url.pathname
      if (p === '/healthz') return json({ ok: true, app: 'karin-neoma', version: 1 })
      if (p.startsWith('/api/')) {
        if (!env.SYNC_KEY || req.headers.get('Authorization') !== `Bearer ${env.SYNC_KEY}`)
          return json({ error: '同期キーが違います' }, 401)
        if (req.headers.get('Origin') && req.headers.get('Origin') !== url.origin)
          return json({ error: 'Origin rejected' }, 403)
        // TEMP_UPLOAD
        if (p === '/api/vaults' && req.method === 'GET')
          return json(
            (
              await env.DB.prepare(
                'SELECT id,name,revision,hash,updated_at FROM vaults ORDER BY updated_at DESC',
              ).all()
            ).results,
          )
        const match = p.match(/^\/api\/vaults\/([a-zA-Z0-9_-]{1,100})(?:\/(versions))?$/)
        if (!match) return json({ error: 'Not found' }, 404)
        const id = match[1]
        if (match[2] && req.method === 'GET')
          return json(
            (
              await env.DB.prepare(
                'SELECT revision,hash,updated_at FROM versions WHERE vault_id=? ORDER BY revision DESC LIMIT 50',
              )
                .bind(id)
                .all()
            ).results,
          )
        if (req.method === 'GET') {
          const rev = url.searchParams.get('revision')
          const row = rev
            ? await env.DB.prepare('SELECT * FROM versions WHERE vault_id=? AND revision=?')
                .bind(id, Number(rev))
                .first()
            : await env.DB.prepare('SELECT * FROM vaults WHERE id=?').bind(id).first()
          if (!row) return json({ error: 'Not found' }, 404)
          const obj = await env.BUCKET.get(row.object_key)
          if (!obj) return json({ error: 'Snapshot missing' }, 503)
          return new Response(obj.body, {
            headers: {
              'Content-Type': 'application/octet-stream',
              'Cache-Control': 'no-store',
              'X-Revision': String(row.revision),
              'X-Hash': row.hash,
            },
          })
        }
        if (req.method === 'PUT' && !match[2]) {
          const expected = Number(req.headers.get('If-Match'))
          const name = req.headers.get('X-Vault-Name')
          if (
            !req.headers.has('If-Match') ||
            !Number.isSafeInteger(expected) ||
            expected < 0 ||
            !name
          )
            return json({ error: 'Invalid metadata' }, 400)
          const declared = Number(req.headers.get('Content-Length'))
          if (declared > 25 * 1024 * 1024) return json({ error: '25MB limit' }, 413)
          const reader = req.body?.getReader()
          if (!reader) return json({ error: 'Empty body' }, 400)
          const chunks = []
          let size = 0
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            size += value.byteLength
            if (size > 25 * 1024 * 1024) {
              await reader.cancel()
              return json({ error: '25MB limit' }, 413)
            }
            chunks.push(value)
          }
          const bytes = new Uint8Array(size)
          let offset = 0
          for (const chunk of chunks) {
            bytes.set(chunk, offset)
            offset += chunk.length
          }
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
          const key = `vaults/${id}/${crypto.randomUUID()}.gz`
          await env.BUCKET.put(key, bytes)
          const now = Date.now()
          // R2 immutable objects first, then one atomic D1 compare-and-swap. Never overwrite a winner's object.
          const change =
            expected === 0
              ? env.DB.prepare(
                  'INSERT INTO vaults VALUES(?,?,1,?,?,?) ON CONFLICT(id) DO NOTHING',
                ).bind(id, decodeURIComponent(name).slice(0, 200), key, hash, now)
              : env.DB.prepare(
                  'UPDATE vaults SET name=?,revision=revision+1,object_key=?,hash=?,updated_at=? WHERE id=? AND revision=?',
                ).bind(decodeURIComponent(name).slice(0, 200), key, hash, now, id, expected)
          const results = await env.DB.batch([
            change,
            env.DB.prepare(
              'INSERT INTO versions SELECT id,revision,object_key,hash,updated_at FROM vaults WHERE id=? AND object_key=?',
            ).bind(id, key),
          ])
          if (!results[0].meta.changes) {
            await env.BUCKET.delete(key)
            return json(
              { error: '別の端末で変更されています。ローカル内容は保持しています。' },
              409,
            )
          }
          return json({ revision: expected + 1, hash })
        }
        return json({ error: 'Method not allowed' }, 405)
      }
      if (!['GET', 'HEAD'].includes(req.method))
        return new Response('Method not allowed', { status: 405 })
      let path = decodeURIComponent(p)
      if (path.includes('..')) return new Response('Bad path', { status: 400 })
      if (path === '/') path = '/index.html'
      let obj = await env.BUCKET.get('assets' + path)
      if (!obj && !path.split('/').pop().includes('.'))
        obj = await env.BUCKET.get('assets/index.html')
      if (!obj) return new Response('Not found', { status: 404 })
      const envelope = JSON.parse(await obj.text());
      const bytes = Uint8Array.from(atob(envelope.gzip), c => c.charCodeAt(0));
      const h = new Headers({'Content-Type':envelope.type});
      h.set('X-Content-Type-Options','nosniff');h.set('Referrer-Policy','same-origin');
      h.set('Cache-Control',path.startsWith('/assets/')?'public,max-age=31536000,immutable':'no-cache');
      const body = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return new Response(req.method==='HEAD'?null:body,{headers:h});

    } catch (e) {
      console.error(e)
      return json({ error: '保存処理に失敗しました。再試行してください。' }, 500)
    }
  },
}
