import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Folder } from '../types/gallery'
import { useFolders } from '../hooks/useFolders'

interface TagDialogProps {
    folder: Folder
    onCancel: () => void
    onSave: () => void
}

const TagDialog: React.FC<TagDialogProps> = ({ folder, onCancel, onSave }) => {
    const [localFolder, setlocalFolder] = useState<Folder>({
        ...folder,
        tags: [...folder.tags],
    })
    const { tags, updateFolderTags } = useFolders()

    useEffect(() => {
        setlocalFolder({ ...folder, tags: [...folder.tags] })
    }, [folder])

    const toggleTag = async (tag: string) => {
        const updatedFolder = { ...localFolder }

        if (updatedFolder.tags?.includes(tag)) {
            // Remove the tag
            updatedFolder.tags = updatedFolder.tags.filter((t) => t !== tag)
        } else {
            // Add the tag
            updatedFolder.tags = [...updatedFolder.tags, tag]
        }

        try {
            await updateFolderTags(updatedFolder.title, updatedFolder.tags)
            setlocalFolder(updatedFolder)
        } catch (err) {
            console.error('Failed to update tags:', err)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">
                        Manage Tags for "{localFolder.title}"
                    </h3>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-full hover:bg-gray-200"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <h4 className="font-semibold mb-2">Current Tags</h4>
                    {localFolder.tags && localFolder.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {localFolder.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-full flex items-center"
                                >
                                    {tag}
                                    <button
                                        onClick={() => toggleTag(tag)}
                                        className="ml-2 bg-blue-600 rounded-full p-1 hover:bg-blue-700 min-h-0 min-w-0"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 mb-4">
                            No tags assigned to this album yet.
                        </p>
                    )}
                </div>

                <div className="overflow-auto flex-grow">
                    <h4 className="font-semibold mb-2">Available Tags</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {tags
                            .filter(
                                (tag) =>
                                    !localFolder.tags ||
                                    !localFolder.tags.includes(tag)
                            )
                            .map((tag) => (
                                <div
                                    key={tag}
                                    className="px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-500 flex items-center"
                                    onClick={() => toggleTag(tag)}
                                >
                                    <span className="mr-2 w-4 h-4 flex items-center justify-center bg-gray-200 text-gray-700 rounded-full">
                                        +
                                    </span>{' '}
                                    {tag}
                                </div>
                            ))}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}

export default React.memo(TagDialog)
