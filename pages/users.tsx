import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Alert,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as SuperAdminIcon,
} from '@mui/icons-material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, User } from '@/lib/supabase'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({ email: '', name: '', role: 'admin' as 'admin' | 'superadmin' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      showSnackbar('Error fetching users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({ email: user.email, name: user.name, role: user.role })
    } else {
      setEditingUser(null)
      setFormData({ email: '', name: '', role: 'admin' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
    setFormData({ email: '', name: '', role: 'admin' })
  }

  const handleSave = async () => {
    if (!formData.email.trim() || !formData.name.trim()) {
      showSnackbar('Please fill in all required fields', 'error')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showSnackbar('Please enter a valid email address', 'error')
      return
    }

    try {
      if (editingUser) {
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingUser.id,
            email: formData.email,
            name: formData.name,
            role: formData.role,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Failed to update user')
        }

        showSnackbar('User updated successfully', 'success')
      } else {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            role: formData.role,
          }),
        })

        const result = await response.json()

        if (!response.ok) {
          if (response.status === 409) {
            showSnackbar('A user with this email already exists', 'error')
          } else {
            throw new Error(result.message || 'Failed to create user')
          }
          return
        }

        showSnackbar('User created successfully', 'success')
      }

      handleCloseDialog()
      fetchUsers()
    } catch (error) {
      console.error('Error saving user:', error)
      showSnackbar('Error saving user', 'error')
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (email === 'chavindun@gmail.com') {
      showSnackbar('Cannot delete the default super admin', 'error')
      return
    }

    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${id}/delete`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete user')
      }

      showSnackbar('User deleted successfully', 'success')
      fetchUsers()
    } catch (error) {
      console.error('Error deleting user:', error)
      showSnackbar('Error deleting user', 'error')
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
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 250,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 150,
      renderCell: (params) => (
        <Chip
          icon={params.value === 'superadmin' ? <SuperAdminIcon /> : <AdminIcon />}
          label={params.value === 'superadmin' ? 'Super Admin' : 'Admin'}
          size="small"
          color={params.value === 'superadmin' ? 'secondary' : 'primary'}
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
            onClick={() => handleDelete(params.row.id, params.row.email)}
            color="error"
            disabled={params.row.email === 'chavindun@gmail.com'}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      ),
    },
  ]

  return (
    <ProtectedRoute requireSuperAdmin>
      <Layout>
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              User Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add User
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            Only registered users can sign in via Google OAuth. Users must use the same email address they were registered with.
          </Alert>

          <Card>
            <CardContent>
              <DataGrid
                rows={users}
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

          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add User'}
            </DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                sx={{ mb: 2 }}
                disabled={editingUser?.email === 'chavindun@gmail.com'}
              />
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'superadmin' })}
                  disabled={editingUser?.email === 'chavindun@gmail.com'}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="superadmin">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSave} variant="contained">
                {editingUser ? 'Update' : 'Add'}
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

  if (!session || session.user.role !== 'superadmin') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
