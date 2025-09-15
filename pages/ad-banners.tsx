import { useEffect, useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useSession } from 'next-auth/react'
import { AdBanner, supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function AdBannersPage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<AdBanner[]>([])
  const [q, setQ] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    id: '',
    company_name: '',
    target_url: '',
    alt_text: '',
    status: true,
    start_date: '',
    end_date: '',
    image_path: '',
    image_url_600: '',
  })
  const [editing, setEditing] = useState(false)

  const canManage = session?.user?.role === 'admin' || session?.user?.role === 'superadmin'

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (activeOnly) params.set('active', 'true')
      const res = await fetch(`/api/ad-banners?${params.toString()}`)
      const json = await res.json()
      setItems(json.items || [])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setForm({ id: '', company_name: '', target_url: '', alt_text: '', status: true, start_date: '', end_date: '', image_path: '', image_url_600: '' })
    setFile(null)
    setEditing(false)
  }

  const onUpload = async () => {
    if (!file) return alert('Select an image')
    const mime = file.type
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (!allowed.includes(mime)) return alert('Invalid file type')
    if (file.size > 2 * 1024 * 1024) return alert('File too large (max 2MB)')

    const res = await fetch(`/api/ad-banners/upload?filename=${encodeURIComponent(file.name)}&mimetype=${encodeURIComponent(mime)}`, {
      method: 'POST',
      body: await file.arrayBuffer(),
    })
    const json = await res.json()
    if (!res.ok) return alert(json.message || 'Upload failed')
    setForm(prev => ({ ...prev, image_path: json.image_path, image_url_600: json.image_url_600 }))
  }

  const onSave = async () => {
    if (!form.company_name || !form.target_url || !form.image_url_600) return alert('Missing required fields')
    const payload = { ...form }
    if (!editing) {
      const res = await fetch('/api/ad-banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) return alert(json.message || 'Create failed')
    } else {
      const res = await fetch(`/api/ad-banners/${form.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!res.ok) return alert(json.message || 'Update failed')
    }
    resetForm()
    fetchItems()
  }

  const onEdit = (item: AdBanner) => {
    setEditing(true)
    setForm({
      id: item.id,
      company_name: item.company_name,
      target_url: item.target_url,
      alt_text: item.alt_text,
      status: item.status,
      start_date: item.start_date?.slice(0,10) || '',
      end_date: item.end_date?.slice(0,10) || '',
      image_path: item.image_path,
      image_url_600: item.image_url_600,
    })
  }

  const onDelete = async (id: string) => {
    if (!confirm('Soft delete this banner?')) return
    const res = await fetch(`/api/ad-banners/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) return alert(json.message || 'Delete failed')
    fetchItems()
  }

  const isActiveByDate = (item: AdBanner) => {
    const today = new Date().toISOString().slice(0,10)
    const startOk = !item.start_date || item.start_date.slice(0,10) <= today
    const endOk = !item.end_date || item.end_date.slice(0,10) >= today
    return startOk && endOk
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Ad Banners</h1>
            {canManage && (
              <Link href="/ad-banners/new" className="btn btn-primary">Create Banner</Link>
            )}
          </div>

          <div className="card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Search</label>
                <input value={q} onChange={e=>setQ(e.target.value)} className="mt-1 input w-full" placeholder="Company name" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input id="activeOnly" type="checkbox" checked={activeOnly} onChange={e=>setActiveOnly(e.target.checked)} />
                <label htmlFor="activeOnly" className="text-sm">Active only</label>
              </div>
              <button onClick={fetchItems} className="btn btn-primary">Search</button>
            </div>
          </div>

          {/* Inline create moved to dedicated page to match site patterns */}

          <div className="card p-4">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-600">
                    <th className="py-2">Preview</th>
                    <th className="py-2">Company</th>
                    <th className="py-2">URL</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Dates</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-t">
                      <td className="py-2">
                        <img src={item.image_url_600} alt={item.alt_text} className="h-10" />
                      </td>
                      <td className="py-2">{item.company_name}</td>
                      <td className="py-2 text-blue-600 truncate max-w-xs">{item.target_url}</td>
                      <td className="py-2">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${item.status && isActiveByDate(item) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.status && isActiveByDate(item) ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-2 text-sm text-gray-600">{(item.start_date||'').slice(0,10)} → {(item.end_date||'').slice(0,10)}</td>
                      <td className="py-2">
                        {canManage && (
                          <div className="flex gap-2">
                            <button className="btn" onClick={()=>onEdit(item)}>Edit</button>
                            <button className="btn btn-danger" onClick={()=>onDelete(item.id)}>Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


