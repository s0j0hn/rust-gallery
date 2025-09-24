import { FC, useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import axios from 'axios'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'

interface ApiDocsProps {
  specUrl: string
  onBack?: () => void
}

const ApiDocs: FC<ApiDocsProps> = ({ specUrl, onBack }) => {
  const [spec, setSpec] = useState<object | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSwaggerSpec = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get(specUrl)
        setSpec(response.data)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching OpenAPI spec:', err)
        setError('Failed to load API documentation. Please try again later.')
        setLoading(false)
      }
    }

    fetchSwaggerSpec()
  }, [specUrl])

  return (
    <div className="swagger-container bg-white rounded-lg shadow-md p-4 overflow-hidden">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition flex items-center"
        >
          <ArrowLeft size={16} className="mr-2" /> Back to Albums
        </button>
      )}

      <h1 className="text-2xl font-bold mb-4">API Documentation</h1>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <RefreshCw size={32} className="animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading API documentation...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <AlertTriangle size={20} className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Documentation</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-1.5 bg-red-100 text-red-800 rounded hover:bg-red-200 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && spec && (
        <div className="swagger-ui-wrapper overflow-auto">
          <SwaggerUI spec={spec} docExpansion="list" filter={true} />
        </div>
      )}
    </div>
  )
}

export default ApiDocs
