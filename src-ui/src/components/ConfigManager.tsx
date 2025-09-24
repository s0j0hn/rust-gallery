import { useState, FC, ChangeEvent, FormEvent } from 'react'
import { Settings, X } from 'lucide-react'
import { JsonConfig } from '../types/gallery'
import { useConfig } from '../context/ConfigContext' // Assuming we're using the dedicated context approach

interface ConfigManagerProps {
  onClose: () => void
}

const ConfigManager: FC<ConfigManagerProps> = ({ onClose }) => {
  // Use the context instead of making separate API calls
  const { config, loading: configLoading, updateConfig } = useConfig()

  // Local state for form values
  const [formValues, setFormValues] = useState<JsonConfig>({ ...config })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Ensure value is a positive number and within reasonable limits
    const numValue = Math.max(1, parseInt(value, 10) || 1)

    setFormValues((prev) => ({
      ...prev,
      [name]: numValue,
    }))
  }

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormValues((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await updateConfig(formValues)
      setSuccessMessage('Configuration updated successfully')
      setError(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to save configuration')
      console.error('Error saving config:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <Settings size={24} className="mr-2" />
          Configuration Settings
        </h2>

        {configLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{successMessage}</div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="equal_enabled">
                Equal enabled
              </label>
              <input
                id="equal_enabled"
                type="checkbox"
                name="equal_enabled"
                onChange={handleCheckboxChange}
                checked={formValues.equal_enabled}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Enable or disable equal random</p>
            </div>

            <div className="mb-4">
              <label
                className="block text-gray-700 font-medium mb-2"
                htmlFor="random_equal_folders"
              >
                Random Equal Folders
              </label>
              <input
                id="random_equal_folders"
                type="number"
                name="random_equal_folders"
                value={formValues.random_equal_folders}
                onChange={handleChange}
                min="2"
                max="50"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of random folders to display on the homepage
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="photo_per_random">
                Photos Per Random
              </label>
              <input
                id="photo_per_random"
                type="number"
                name="photo_per_random"
                value={formValues.photo_per_random}
                onChange={handleChange}
                min="1"
                max="500"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of random photos to display on folder cards
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2" htmlFor="folders_per_page">
                Folders Per Page
              </label>
              <input
                id="folders_per_page"
                type="number"
                name="folders_per_page"
                value={formValues.folders_per_page}
                onChange={handleChange}
                min="3"
                max="64"
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of folders to load in each page of infinite scroll
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 mr-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center ${
                  saving ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ConfigManager
