import { useEffect, useState } from 'react'

const useMobile = (breakpoint = 768): boolean => {
    return false
    // const [isMobile, setIsMobile] = useState<boolean>(
    //     typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
    // )
    //
    // useEffect(() => {
    //     if (typeof window === 'undefined') return
    //
    //     const handleResize = () => {
    //         setIsMobile(window.innerWidth < breakpoint)
    //     }
    //
    //     // Add event listener
    //     window.addEventListener('resize', handleResize)
    //
    //     // Call handler right away to update state with initial window size
    //     handleResize()
    //
    //     // Remove event listener on cleanup
    //     return () => window.removeEventListener('resize', handleResize)
    // }, [breakpoint])
    //
    // return isMobile
}

export default useMobile
