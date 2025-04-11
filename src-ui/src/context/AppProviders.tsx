// Update AppProviders.tsx to include all contexts
import React from 'react'
import { ConfigProvider } from './ConfigContext'
import { FolderProvider } from './FolderContext'
import { UIProvider } from './UIContext'
// Include other providers as needed

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        <ConfigProvider>
            <FolderProvider>
                <UIProvider>{children}</UIProvider>
            </FolderProvider>
        </ConfigProvider>
    )
}
