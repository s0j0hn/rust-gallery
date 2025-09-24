// src-ui/src/pages/ApiDocs.tsx
import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import ApiDocsComponent from '../components/ApiDocs'
import { API_BASE_URL } from '../config/constants'

const ApiDocs: FC = () => {
  const navigate = useNavigate()

  // API Documentation URL
  const apiDocsUrl = `${API_BASE_URL}/openapi.json`

  const handleBack = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <ApiDocsComponent specUrl={apiDocsUrl} onBack={handleBack} />
      </div>
    </div>
  )
}

export default ApiDocs
