import React from 'react'
import Router from './Router'
import { FolderProvider } from './context/FolderContext'
import { UIProvider } from './context/UIContext'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from './context/ConfigContext'

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <ConfigProvider>
                <FolderProvider>
                    <UIProvider>
                        <Router />
                    </UIProvider>
                </FolderProvider>
            </ConfigProvider>
        </BrowserRouter>
    )
}
export default App
