import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Input,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Papa from 'papaparse'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, Subscriber, EmailList } from '@/lib/supabase'

export default function Subscribers() {
  const router = useRouter()
  const { id } = router.query
  const [emailList, setEmailList] = useState<EmailList | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openImportDialog, setOpenImportDialog] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvData, setCsvData] = useState<string[]>([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    if (id) {
      fetchEmailList()
      fetchSubscribers()
    }
  }, [id])

  const fetchEmailList = async () => {
    try {
      const { data, error } = await supabase
        .from('email_lists')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setEmailList(data)
    } catch (error) {
      console.error('Error fetching email list:', error)
      showSnackbar('Error fetching email list', 'error')
    }
  }

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email_list_id', id)
        .order('subscribed_at', { ascending: false })

      if (error) throw error
      setSubscribers(data || [])
    } catch (error) {
      console.error('Error fetching subscribers:', error)
      showSnackbar('Error fetching subscribers', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleAddSubscriber = async () => {
    if (!newEmail.trim()) {
      showSnackbar('Please enter an email address', 'error')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      showSnackbar('Please enter a valid email address', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('subscribers')
        .insert({
          email: newEmail.toLowerCase().trim(),
          email_list_id: id,
          status: 'active',
          unsubscribe_token: crypto.randomUUID(),
        })

      if (error) {
        if (error.code === '23505') {
          showSnackbar('This email is already subscribed to this list', 'error')
        } else {
          throw error
        }
        return
      }

      showSnackbar('Subscriber added successfully', 'success')
      setOpenDialog(false)
      setNewEmail('')
      fetchSubscribers()
    } catch (error) {
      console.error('Error adding subscriber:', error)
      showSnackbar('Error adding subscriber', 'error')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    Papa.parse(file, {
      complete: (results) => {
        const emails: string[] = []
        results.data.forEach((row: any) => {
          if (Array.isArray(row)) {
            // Find email in the row
            row.forEach((cell: any) => {
              if (typeof cell === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cell)) {
                emails.push(cell.toLowerCase().trim())
              }
            })
          }
        })
        setCsvData([...new Set(emails)]) // Remove duplicates
      },
      header: false,
    })
  }

  const handleImportCsv = async () => {
    if (csvData.length === 0) {
      showSnackbar('No valid emails found in the CSV file', 'error')
      return
    }

    try {
      const subscribersToInsert = csvData.map(email => ({
        email,
        email_list_id: id,
        status: 'active' as const,
        unsubscribe_token: crypto.randomUUID(),
      }))

      const { error } = await supabase
        .from('subscribers')
        .insert(subscribersToInsert)

      if (error) {
        console.error('Import error:', error)
        showSnackbar(`Imported some emails. Some may have been skipped due to duplicates.`, 'success')
      } else {
        showSnackbar(`Successfully imported ${csvData.length} subscribers`, 'success')
      }

      setOpenImportDialog(false)
      setCsvFile(null)
      setCsvData([])
      fetchSubscribers()
    } catch (error) {
      console.error('Error importing subscribers:', error)
      showSnackbar('Error importing subscribers', 'error')
    }
  }

  const handleDelete = async (subscriberId: string) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', subscriberId)

      if (error) throw error
      showSnackbar('Subscriber deleted successfully', 'success')
      fetchSubscribers()
    } catch (error) {
      console.error('Error deleting subscriber:', error)
      showSnackbar('Error deleting subscriber', 'error')
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === 'active' ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'subscribed_at',
      headerName: 'Subscribed',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => handleDelete(params.row.id)}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ]

  return (
    <ProtectedRoute>
      <Layout>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h1">
                Subscribers
              </Typography>
              {emailList && (
                <Typography variant="subtitle1" color="text.secondary">
                  {emailList.name}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => setOpenImportDialog(true)}
              >
                Import CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenDialog(true)}
              >
                Add Subscriber
              </Button>
            </Box>
          </Box>

          <Card>
            <CardContent>
              <DataGrid
                rows={subscribers}
                columns={columns}
                loading={loading}
                autoHeight
                disableRowSelectionOnClick
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
              />
            </CardContent>
          </Card>

          {/* Add Subscriber Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add Subscriber</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Email Address"
                type="email"
                fullWidth
                variant="outlined"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleAddSubscriber} variant="contained">
                Add
              </Button>
            </DialogActions>
          </Dialog>

          {/* Import CSV Dialog */}
          <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Import Subscribers from CSV</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Upload a CSV file containing email addresses. The system will automatically detect email addresses in any column.
              </Typography>
              <Input
                type="file"
                inputProps={{ accept: '.csv' }}
                onChange={handleFileUpload}
                fullWidth
                sx={{ mb: 2 }}
              />
              {csvData.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Found {csvData.length} valid email addresses
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenImportDialog(false)}>Cancel</Button>
              <Button 
                onClick={handleImportCsv} 
                variant="contained" 
                disabled={csvData.length === 0}
              >
                Import {csvData.length} Subscribers
              </Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      </Layout>
    </ProtectedRoute>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context)

  if (!session) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
