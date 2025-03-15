// src-ui/src/components/DeleteDialog.tsx
import React from 'react'
import { Trash2 } from 'lucide-react'
import { Folder } from '../types/gallery'

interface DeleteDialogProps {
    folder: Folder
    onCancel: () => void
    onConfirm: () => void
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
    folder,
    onCancel,
    onConfirm,
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-2">Delete Folder</h3>
                <p className="mb-4">
                    Are you sure you want to delete "{folder.title}"? This
                    action cannot be undone.
                </p>
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition flex items-center"
                    >
                        <Trash2 size={16} className="mr-2" />
                        Delete Folder
                    </button>
                </div>
            </div>
        </div>
    )
}

export default React.memo(DeleteDialog)
