import React from 'react'
import Router from './Router'
import { FolderProvider } from './context/FolderContext'
import { UIProvider } from './context/UIContext'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from './context/ConfigContext'
import ErrorBoundary from './components/ErrorBoundary'

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <ConfigProvider>
                    <FolderProvider>
                        <UIProvider>
                            <ErrorBoundary>
                                <Router />
                            </ErrorBoundary>
                        </UIProvider>
                    </FolderProvider>
                </ConfigProvider>
            </BrowserRouter>
        </ErrorBoundary>
    )
}
export default App
