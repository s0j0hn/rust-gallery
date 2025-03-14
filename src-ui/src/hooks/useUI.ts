// src-ui/src/hooks/useUI.ts
import { useContext } from 'react'
import { UIContext } from '../context/UIContext'

export const useUI = () => {
    return useContext(UIContext)
}
