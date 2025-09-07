import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Drafts as DraftsIcon,
  Refresh as ResendIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { useRouter } from 'next/router'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, Newsletter } from '@/lib/supabase'

export default function Newsletters() {
  const router = useRouter()
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const fetchNewsletters = async () => {
    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNewsletters(data || [])
    } catch (error) {
      console.error('Error fetching newsletters:', error)
      showSnackbar('Error fetching newsletters', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id)

      if (error) throw error
      showSnackbar('Newsletter deleted successfully', 'success')
      fetchNewsletters()
    } catch (error) {
      console.error('Error deleting newsletter:', error)
      showSnackbar('Error deleting newsletter', 'error')
    }
  }

  const handleResend = async (id: string) => {
    if (!confirm('Are you sure you want to resend this newsletter? This will send it again to all subscribers.')) {
      return
    }

    try {
      const response = await fetch(`/api/newsletters/send/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (response.ok) {
        showSnackbar(result.message, 'success')
        fetchNewsletters()
      } else {
        showSnackbar(result.message || 'Error resending newsletter', 'error')
      }
    } catch (error) {
      console.error('Error resending newsletter:', error)
      showSnackbar('Error resending newsletter', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default'
      case 'scheduled':
        return 'warning'
      case 'sent':
        return 'success'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <DraftsIcon />
      case 'scheduled':
        return <ScheduleIcon />
      case 'sent':
        return <SendIcon />
      default:
        return <DraftsIcon />
    }
  }

  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Title',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value.charAt(0).toUpperCase() + params.value.slice(1)}
          size="small"
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'selected_posts',
      headerName: 'Posts',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value?.length || 0}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'email_list_ids',
      headerName: 'Lists',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value?.length || 0}
          size="small"
          variant="outlined"
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
      field: 'sent_at',
      headerName: 'Sent',
      width: 120,
      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => router.push(`/newsletters/${params.row.id}`)}
            color="primary"
            title="Edit"
          >
            <EditIcon />
          </IconButton>
          {params.row.status === 'sent' && (
            <IconButton
              size="small"
              onClick={() => handleResend(params.row.id)}
              color="secondary"
              title="Resend"
            >
              <ResendIcon />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={() => handleDelete(params.row.id)}
            color="error"
            disabled={params.row.status === 'sent'}
            title="Delete"
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
              Newsletters
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/newsletters/new')}
            >
              Create Newsletter
            </Button>
          </Box>

          <Card>
            <CardContent>
              <DataGrid
                rows={newsletters}
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
