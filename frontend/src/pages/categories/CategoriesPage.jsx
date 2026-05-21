import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, FolderOpen, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import categoryService from '../../services/categoryService.js'
import Modal from '../../components/common/Modal.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../../components/common/ErrorMessage.jsx'

function CategoryForm({ initial, categories, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    parent_id: initial?.parent_id || '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Category name"
          className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Optional description"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Parent Category</label>
        <select
          value={form.parent_id}
          onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">None (top-level)</option>
          {categories.filter((c) => !initial || c.id !== initial.id).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : initial ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  )
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'create' | category object for edit
  const [deleteId, setDeleteId] = useState(null)

  const { data: categories = [], isLoading, error, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  })

  const createMutation = useMutation({
    mutationFn: (data) => categoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created')
      setModal(null)
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to create'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated')
      setModal(null)
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to update'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted')
      setDeleteId(null)
    },
    onError: (err) => toast.error(err?.response?.data?.detail || 'Failed to delete'),
  })

  // Build hierarchy
  const topLevel = categories.filter((c) => !c.parent_id)
  const getChildren = (parentId) => categories.filter((c) => c.parent_id === parentId)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderOpen size={24} className="text-blue-600" />
            Categories
          </h1>
          <p className="text-gray-500 text-sm mt-1">Organize articles into categories</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner centered />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No categories yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Description</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Parent</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topLevel.map((cat) => (
                <React.Fragment key={cat.id}>
                  <CategoryRow
                    cat={cat}
                    depth={0}
                    onEdit={() => setModal(cat)}
                    onDelete={() => setDeleteId(cat.id)}
                    parentName={null}
                  />
                  {getChildren(cat.id).map((child) => (
                    <CategoryRow
                      key={child.id}
                      cat={child}
                      depth={1}
                      onEdit={() => setModal(child)}
                      onDelete={() => setDeleteId(child.id)}
                      parentName={cat.name}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        isOpen={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'create' ? 'Create Category' : 'Edit Category'}
      >
        <CategoryForm
          initial={modal !== 'create' ? modal : null}
          categories={categories}
          isLoading={createMutation.isPending || updateMutation.isPending}
          onSubmit={(data) => {
            if (modal === 'create') {
              createMutation.mutate(data)
            } else {
              updateMutation.mutate({ id: modal.id, data })
            }
          }}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Category"
        message="Are you sure you want to delete this category? Articles in this category will be unassigned."
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}

function CategoryRow({ cat, depth, onEdit, onDelete, parentName }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-3">
        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
          {depth > 0 && <ChevronRight size={14} className="text-gray-400" />}
          <FolderOpen size={16} className={depth === 0 ? 'text-blue-500' : 'text-gray-400'} />
          <span className={`text-sm font-medium ${depth === 0 ? 'text-gray-900' : 'text-gray-700'}`}>
            {cat.name}
          </span>
          {cat.article_count !== undefined && (
            <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
              {cat.article_count}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3 hidden md:table-cell">
        <span className="text-sm text-gray-500 line-clamp-1">{cat.description || '—'}</span>
      </td>
      <td className="px-5 py-3 hidden sm:table-cell">
        <span className="text-sm text-gray-500">{parentName || '—'}</span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>
    </tr>
  )
}
