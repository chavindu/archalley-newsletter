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
  Grid,
  IconButton,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  People as PeopleIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, EmailList } from '@/lib/supabase'
import { useSession } from 'next-auth/react'

export default function EmailLists() {
  const router = useRouter()
  const { data: session } = useSession()
  const [emailLists, setEmailLists] = useState<EmailList[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingList, setEditingList] = useState<EmailList | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    fetchEmailLists()
  }, [])

  const fetchEmailLists = async () => {
    try {
      const { data, error } = await supabase
        .from('email_lists')
        .select(`
          *,
          subscribers:subscribers(count)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setEmailLists(data || [])
    } catch (error) {
      console.error('Error fetching email lists:', error)
      showSnackbar('Error fetching email lists', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleOpenDialog = (list?: EmailList) => {
    if (list) {
      setEditingList(list)
      setFormData({ name: list.name, description: list.description || '' })
    } else {
      setEditingList(null)
      setFormData({ name: '', description: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingList(null)
    setFormData({ name: '', description: '' })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showSnackbar('Please enter a name for the email list', 'error')
      return
    }

    try {
      if (editingList) {
        const { error } = await supabase
          .from('email_lists')
          .update({
            name: formData.name,
            description: formData.description,
          })
          .eq('id', editingList.id)

        if (error) throw error
        showSnackbar('Email list updated successfully', 'success')
      } else {
        const { error } = await supabase
          .from('email_lists')
          .insert({
            name: formData.name,
            description: formData.description,
            created_by: session?.user?.id,
          })

        if (error) throw error
        showSnackbar('Email list created successfully', 'success')
      }

      handleCloseDialog()
      fetchEmailLists()
    } catch (error) {
      console.error('Error saving email list:', error)
      showSnackbar('Error saving email list', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this email list? This will also delete all subscribers.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('email_lists')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSnackbar('Email list deleted successfully', 'success')
      fetchEmailLists()
    } catch (error) {
      console.error('Error deleting email list:', error)
      showSnackbar('Error deleting email list', 'error')
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'subscriber_count',
      headerName: 'Subscribers',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={<PeopleIcon />}
          label={params.row.subscribers?.[0]?.count || 0}
          size="small"
          color="primary"
        />
      ),
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 120,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <ProtectedRoute>
      <Layout>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Email Lists
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Email List
            </Button>
          </Box>

          <Card>
            <CardContent>
              <DataGrid
                rows={emailLists}
                columns={columns}
                loading={loading}
                autoHeight
                disableRowSelectionOnClick
                onRowClick={(params) => router.push(`/email-lists/${params.row.id}/subscribers`)}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                sx={{
                  '& .MuiDataGrid-row': {
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 165, 0, 0.04)',
                    },
                  },
                }}
              />
            </CardContent>
          </Card>

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingList ? 'Edit Email List' : 'Create Email List'}
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSave} variant="contained">
                {editingList ? 'Update' : 'Create'}
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
