import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import tagService from '../../services/tagService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

export default function TagsPage() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole('admin')
  const queryClient = useQueryClient()

  const [createModal, setCreateModal] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [nameError, setNameError] = useState('')

  const { data: tags = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tags'],
    queryFn: tagService.getTags,
  })

  const createMutation = useMutation({
    mutationFn: (data) => tagService.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag created')
      setCreateModal(false)
      setNewTagName('')
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to create tag'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => tagService.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag deleted')
      setDeleteId(null)
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to delete tag'),
  })

  const handleCreate = (e) => {
    e.preventDefault()
    if (!newTagName.trim()) { setNameError('Tag name is required'); return }
    setNameError('')
    createMutation.mutate({ name: newTagName.trim() })
  }

  const getTagColor = (name) => {
    const colors = [
      'bg-blue-50 text-blue-600 border-blue-200',
      'bg-green-50 text-green-600 border-green-200',
      'bg-purple-50 text-purple-600 border-purple-200',
      'bg-yellow-50 text-yellow-600 border-yellow-200',
      'bg-red-50 text-red-600 border-red-200',
      'bg-teal-50 text-teal-600 border-teal-200',
      'bg-orange-50 text-orange-600 border-orange-200',
    ]
    const idx = name.charCodeAt(0) % colors.length
    return colors[idx]
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag size={24} className="text-blue-600" />
            Tags
          </h1>
          <p className="text-gray-500 text-sm mt-1">Browse and manage article tags</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={16} />
            Add Tag
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner centered />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Tag size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No tags yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">{tags.length} tags total</span>
          </div>
          <div className="p-5 flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getTagColor(tag.name)}`}
              >
                <Tag size={12} />
                <span>{tag.name}</span>
                {tag.article_count !== undefined && (
                  <span className="text-xs opacity-70">({tag.article_count})</span>
                )}
                {isAdmin && (
                  <button
                    onClick={() => setDeleteId(tag.id)}
                    className="ml-1 hover:opacity-70 transition-opacity"
                    title="Delete tag"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Also show as table for admins */}
      {isAdmin && tags.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">All Tags (Admin View)</h3>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Tag Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Articles</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-blue-500" />
                      <span className="text-sm font-medium text-gray-900">{tag.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span className="text-sm text-gray-500">{tag.article_count ?? 0}</span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => setDeleteId(tag.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={createModal} onClose={() => { setCreateModal(false); setNewTagName(''); setNameError('') }} title="Create Tag" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tag Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="e.g. JavaScript, Tutorial, API..."
              className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${nameError ? 'border-red-400' : 'border-gray-200'}`}
              autoFocus
            />
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Tag'}
          </button>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Tag"
        message="Are you sure you want to delete this tag? It will be removed from all articles."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
