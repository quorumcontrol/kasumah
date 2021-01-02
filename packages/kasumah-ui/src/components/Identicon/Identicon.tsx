import React, {useEffect, useRef} from 'react'
import './jazzicon.d.ts'
import Jazzicon from 'jazzicon'

export const Identicon:React.FC<{account:string}> = ({account}) => {
    const ref = useRef<HTMLDivElement>()
  
    useEffect(() => {
      if (account && ref.current) {
        ref.current.innerHTML = ''
        ref.current.appendChild(Jazzicon(32, parseInt(account.slice(2, 10), 16)))
      }
    }, [account])
  
    return <div ref={ref as any} />
}