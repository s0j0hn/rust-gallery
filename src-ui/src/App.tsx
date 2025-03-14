import React from 'react'
import Router from './Router'
import { FolderProvider } from './context/FolderContext'
import { UIProvider } from './context/UIContext'
import { BrowserRouter } from 'react-router-dom'

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <FolderProvider>
                <UIProvider>
                    <Router />
                </UIProvider>
            </FolderProvider>
        </BrowserRouter>
    )
}
export default App
