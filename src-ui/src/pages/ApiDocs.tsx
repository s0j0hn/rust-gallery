// src-ui/src/pages/ApiDocs.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import ApiDocsComponent from '../components/ApiDocs'
import MobileNavigation from '../components/MobileNavigation'
import { useFolders } from '../hooks/useFolders'
import useMobile from '../hooks/useMobile'

const ApiDocs: React.FC = () => {
    const navigate = useNavigate()
    const isMobile = useMobile()
    const { isIndexing, startIndexation } = useFolders()

    // API Documentation URL
    const apiDocsUrl = 'http://192.168.1.27:8000/openapi.json'

    const handleBack = () => {
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-gray-100 mobile-safe-bottom">
            <div className="container mx-auto p-4">
                <ApiDocsComponent specUrl={apiDocsUrl} onBack={handleBack} />
            </div>

            {isMobile && (
                <MobileNavigation
                    onHomeClick={handleBack}
                    onRootClick={() => {
                        navigate('/', { state: { showRoots: true } })
                    }}
                    onTagsClick={() => {
                        navigate('/')
                    }}
                    onIndexClick={startIndexation}
                    onApiDocsClick={() => {}}
                    isIndexing={isIndexing}
                />
            )}
        </div>
    )
}

export default ApiDocs
