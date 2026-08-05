import { lazy, Suspense, useEffect, useState } from 'react'
import Tv from './Tv'
import Spectator from './Spectator'

const Controller = lazy(() => import('./Controller'))
const Admin = lazy(() => import('./Admin'))

/** 큰 가로 화면(노트북·TV)이면 TV 화면, 폰이면 관전 화면 */
function isBigScreen() {
  return window.innerWidth >= 1024 && window.innerWidth > window.innerHeight
}

export default function App() {
  const path = location.pathname.replace(/\/+$/, '') || '/'
  const [big, setBig] = useState(isBigScreen)

  useEffect(() => {
    const on = () => setBig(isBigScreen())
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => {
      window.removeEventListener('resize', on)
      window.removeEventListener('orientationchange', on)
    }
  }, [])

  const fallback = (
    <div className="tex-hall flex min-h-full items-center justify-center">
      <div className="txt-court anim-blink text-[20px] text-brass-300">불러오는 중…</div>
    </div>
  )

  switch (path) {
    case '/tv':
      return <Tv role="tv" />
    case '/phone':
      return <Spectator />
    case '/control':
      return (
        <Suspense fallback={fallback}>
          <Controller />
        </Suspense>
      )
    case '/admin':
      return (
        <Suspense fallback={fallback}>
          <Admin />
        </Suspense>
      )
    default:
      // 루트: 화면 크기로 자동 판단 (노트북/TV → 큰 화면, 폰 → 관전 요약)
      return big ? <Tv role="spectator" /> : <Spectator />
  }
}
