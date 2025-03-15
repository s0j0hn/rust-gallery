import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import FolderList from './pages/FolderList'
import FolderDetail from './pages/FolderDetail'
import TagView from './pages/TagView'
import ApiDocs from './pages/ApiDocs'

const Router: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<FolderList />} />
            <Route path="/folder/:folderName" element={<FolderDetail />} />
            <Route path="/tag/:tagName" element={<TagView />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default Router
