import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

interface BackupSettings {
  onedrive_backup_path: string
  backup_retention_days: number
  onedrive_connected: boolean
}

interface BackupRun {
  id: string
  started_at: string
  finished_at: string | null
  status: 'running' | 'success' | 'failed'
  file_name: string | null
  file_size_bytes: number | null
  error: string | null
}

export default function AdminBackups() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<BackupSettings>({
    onedrive_backup_path: '/Backups/ArchAlley',
    backup_retention_days: 14,
    onedrive_connected: false
  })
  const [backupRuns, setBackupRuns] = useState<BackupRun[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [runningBackup, setRunningBackup] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [statusCheck, setStatusCheck] = useState<any>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [settingsRes, runsRes] = await Promise.all([
        fetch('/api/admin/backup/settings'),
        fetch('/api/admin/backup/runs')
      ])

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setSettings(settingsData)
      }

      if (runsRes.ok) {
        const runsData = await runsRes.json()
        setBackupRuns(runsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/backup/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onedrive_backup_path: settings.onedrive_backup_path,
          backup_retention_days: settings.backup_retention_days,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleConnectOneDrive = () => {
    window.location.href = '/api/onedrive/oauth/start'
  }

  const handleRunBackup = async () => {
    setRunningBackup(true)
    try {
      const response = await fetch('/api/backup/run?manual=1', {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({ type: 'success', text: `Backup completed: ${result.fileName}` })
        loadData() // Refresh the runs list
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Backup failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Backup failed' })
    } finally {
      setRunningBackup(false)
    }
  }

  const handleCheckStatus = async () => {
    setCheckingStatus(true)
    try {
      const response = await fetch('/api/admin/backup/status')
      if (response.ok) {
        const status = await response.json()
        setStatusCheck(status)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: `Status check failed: ${error.message}` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Status check failed' })
    } finally {
      setCheckingStatus(false)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <ProtectedRoute requireSuperAdmin>
        <Layout>
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireSuperAdmin>
      <Layout>
        <div className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Backup Management</h1>

          {message && (
            <div className={`mb-6 p-4 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Settings Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OneDrive Backup Path
                </label>
                <input
                  type="text"
                  value={settings.onedrive_backup_path}
                  onChange={(e) => setSettings({ ...settings, onedrive_backup_path: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="/Backups/ArchAlley"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retention Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settings.backup_retention_days}
                  onChange={(e) => setSettings({ ...settings, backup_retention_days: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>

              <button
                onClick={handleConnectOneDrive}
                className={`px-4 py-2 rounded-md ${
                  settings.onedrive_connected
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {settings.onedrive_connected ? 'Reconnect OneDrive' : 'Connect OneDrive'}
              </button>

              <button
                onClick={handleRunBackup}
                disabled={runningBackup || !settings.onedrive_connected}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {runningBackup ? 'Running Backup...' : 'Run Test Backup'}
              </button>

              <button
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {checkingStatus ? 'Checking...' : 'Check Database Status'}
              </button>
            </div>

            {settings.onedrive_connected && (
              <div className="mt-4 text-sm text-green-600">
                ✓ OneDrive connected successfully
              </div>
            )}
          </div>

          {/* Database Status Section */}
          {statusCheck && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-3 rounded-md ${
                  statusCheck.database_connected ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className="font-medium">Database Connection</div>
                  <div>{statusCheck.database_connected ? '✓ Connected' : '✗ Failed'}</div>
                </div>

                <div className={`p-3 rounded-md ${
                  statusCheck.app_settings_exists ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className="font-medium">App Settings Table</div>
                  <div>{statusCheck.app_settings_exists ? '✓ Exists' : '✗ Missing'}</div>
                </div>

                <div className={`p-3 rounded-md ${
                  statusCheck.superadmin_user_exists ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className="font-medium">Superadmin User</div>
                  <div>{statusCheck.superadmin_user_exists ? '✓ Found' : '✗ Not Found'}</div>
                </div>

                <div className={`p-3 rounded-md ${
                  statusCheck.backup_runs_table_exists ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <div className="font-medium">Backup Runs Table</div>
                  <div>{statusCheck.backup_runs_table_exists ? '✓ Exists' : '✗ Missing'}</div>
                </div>
              </div>

              {statusCheck.details && Object.keys(statusCheck.details).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Details:</h3>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(statusCheck.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Backup Runs Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Backup Runs</h2>
            
            {backupRuns.length === 0 ? (
              <p className="text-gray-500">No backup runs found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {backupRuns.map((run) => (
                      <tr key={run.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(run.started_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            run.status === 'success' 
                              ? 'bg-green-100 text-green-800'
                              : run.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {run.file_name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatFileSize(run.file_size_bytes)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {run.finished_at 
                            ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
                            : 'Running...'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}
