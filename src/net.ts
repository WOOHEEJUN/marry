import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppState, Config, Conn, Fx, Role } from './types'

type Status = 'connecting' | 'open' | 'denied' | 'closed'

const WS_URL = () => {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${location.host}/ws`
}

export function useSync(role: Role, pin?: string) {
  const [state, setState] = useState<AppState | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [conn, setConn] = useState<Conn>({ tv: 0, control: 0, spectator: 0, admin: 0 })
  const [status, setStatus] = useState<Status>('connecting')
  const [fx, setFx] = useState<Fx | null>(null)
  const sockRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aliveRef = useRef(true)

  useEffect(() => {
    aliveRef.current = true

    const connect = () => {
      if (!aliveRef.current) return
      setStatus((s) => (s === 'denied' ? s : 'connecting'))
      let ws: WebSocket
      try {
        ws = new WebSocket(WS_URL())
      } catch {
        retryRef.current = setTimeout(connect, 1500)
        return
      }
      sockRef.current = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'hello', role, pin }))
      }

      ws.onmessage = (ev) => {
        let m: any
        try {
          m = JSON.parse(ev.data)
        } catch {
          return
        }
        if (m.type === 'hello.ok') setStatus('open')
        else if (m.type === 'denied') {
          setStatus('denied')
          ws.close()
        } else if (m.type === 'state') {
          setState(m.state)
          if (m.conn) setConn(m.conn)
        } else if (m.type === 'config') setConfig(m.config)
        else if (m.type === 'fx') setFx(m.fx)
      }

      ws.onclose = () => {
        if (!aliveRef.current) return
        setStatus((s) => (s === 'denied' ? s : 'closed'))
        retryRef.current = setTimeout(connect, 1200)
      }
      ws.onerror = () => {
        try {
          ws.close()
        } catch {}
      }
    }

    connect()
    return () => {
      aliveRef.current = false
      if (retryRef.current) clearTimeout(retryRef.current)
      try {
        sockRef.current?.close()
      } catch {}
    }
  }, [role, pin])

  const dispatch = useCallback((action: any) => {
    const ws = sockRef.current
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'action', action }))
    }
  }, [])

  return { state, config, conn, status, fx, dispatch }
}

/** 1회성 연출 이벤트 구독 */
export function useFxListener(fx: Fx | null, handler: (f: Fx) => void) {
  const seen = useRef<string>('')
  const h = useRef(handler)
  h.current = handler
  useEffect(() => {
    if (!fx || fx._id === seen.current) return
    seen.current = fx._id
    h.current(fx)
  }, [fx])
}
