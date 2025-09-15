import { useState } from 'react'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRouter } from 'next/router'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function NewAdBannerPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    company_name: '',
    target_url: '',
    alt_text: '',
    status: true,
    start_date: '',
    end_date: '',
    image_path: '',
    image_url_600: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success'|'error'}>({ open: false, message: '', severity: 'success' })

  const show = (m: string, s: 'success'|'error' = 'success') => setSnackbar({ open: true, message: m, severity: s })

  const onUpload = async () => {
    if (!file) return show('Select an image', 'error')
    const mime = file.type
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
    if (!allowed.includes(mime)) return show('Invalid file type', 'error')
    if (file.size > 2 * 1024 * 1024) return show('File too large (max 2MB)', 'error')
    const res = await fetch(`/api/ad-banners/upload?filename=${encodeURIComponent(file.name)}&mimetype=${encodeURIComponent(mime)}`, {
      method: 'POST',
      body: await file.arrayBuffer(),
    })
    const json = await res.json()
    if (!res.ok) return show(json.message || 'Upload failed', 'error')
    setForm(prev => ({ ...prev, image_path: json.image_path, image_url_600: json.image_url_600 }))
    show('Image uploaded')
  }

  const onSave = async () => {
    if (!form.company_name || !form.target_url || !form.image_url_600) return show('Fill required fields and upload image', 'error')
    setSaving(true)
    try {
      const res = await fetch('/api/ad-banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Create failed')
      show('Banner created', 'success')
      router.push('/ad-banners')
    } catch (e: any) {
      show(e.message || 'Error', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div>
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.push('/ad-banners')}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Ad Banner</h1>
              <p className="text-gray-600">Upload and configure a new ad banner</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Banner Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input className="mt-1 input-field" value={form.company_name} onChange={e=>setForm({...form, company_name: e.target.value, alt_text: `${e.target.value} Ad`})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Target URL</label>
                    <input className="mt-1 input-field" value={form.target_url} onChange={e=>setForm({...form, target_url: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alt Text</label>
                    <input className="mt-1 input-field" value={form.alt_text} onChange={e=>setForm({...form, alt_text: e.target.value})} />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input id="status" type="checkbox" checked={form.status} onChange={e=>setForm({...form, status: e.target.checked})} />
                    <label htmlFor="status" className="text-sm">Active</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" className="mt-1 input-field" value={form.start_date} onChange={e=>setForm({...form, start_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" className="mt-1 input-field" value={form.end_date} onChange={e=>setForm({...form, end_date: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Image</h2>
                <label className="block text-sm font-medium text-gray-700">34:9 ratio, max 2MB</label>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={e=>setFile(e.target.files?.[0] || null)} />
                <div className="flex gap-2 mt-3 items-center">
                  <button className="btn-secondary" onClick={onUpload}>Upload & Process</button>
                  {form.image_url_600 && <img src={form.image_url_600} alt="preview" className="h-10" />}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <button className="btn-primary w-full" disabled={saving} onClick={onSave}>
                  {saving ? 'Saving...' : 'Create Banner'}
                </button>
              </div>
            </div>
          </div>

          {snackbar.open && (
            <div className="fixed bottom-4 right-4 z-50">
              <div className={`p-4 rounded-md shadow-lg ${snackbar.severity === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{snackbar.message}</p>
                  </div>
                  <button onClick={() => setSnackbar({ ...snackbar, open: false })} className="ml-4 text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}


