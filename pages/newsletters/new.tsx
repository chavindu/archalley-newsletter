import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
  Paper,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase, EmailList } from '@/lib/supabase'
import { fetchWordPressPosts, WordPressPost, getCategoryNames, getFeaturedImage, stripHtmlTags } from '@/lib/wordpress'

export default function NewNewsletter() {
  const router = useRouter()
  const { data: session } = useSession()
  const [title, setTitle] = useState('')
  const [selectedPosts, setSelectedPosts] = useState<WordPressPost[]>([])
  const [selectedEmailLists, setSelectedEmailLists] = useState<string[]>([])
  const [emailLists, setEmailLists] = useState<EmailList[]>([])
  const [wordpressPosts, setWordpressPosts] = useState<WordPressPost[]>([])
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    fetchEmailLists()
    fetchPosts()
  }, [])

  const fetchEmailLists = async () => {
    try {
      const { data, error } = await supabase
        .from('email_lists')
        .select('*')
        .order('name')

      if (error) throw error
      setEmailLists(data || [])
    } catch (error) {
      console.error('Error fetching email lists:', error)
      showSnackbar('Error fetching email lists', 'error')
    }
  }

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { posts } = await fetchWordPressPosts(1, 20)
      setWordpressPosts(posts)
    } catch (error) {
      console.error('Error fetching WordPress posts:', error)
      showSnackbar('Error fetching WordPress posts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handlePostSelection = (post: WordPressPost) => {
    setSelectedPosts(prev => {
      const isSelected = prev.some(p => p.id === post.id)
      if (isSelected) {
        return prev.filter(p => p.id !== post.id)
      } else {
        return [...prev, post]
      }
    })
  }

  const handleEmailListChange = (event: SelectChangeEvent<typeof selectedEmailLists>) => {
    const value = event.target.value
    setSelectedEmailLists(typeof value === 'string' ? value.split(',') : value)
  }

  const handleSave = async (status: 'draft' | 'scheduled' = 'draft') => {
    if (!title.trim()) {
      showSnackbar('Please enter a newsletter title', 'error')
      return
    }

    if (selectedPosts.length === 0) {
      showSnackbar('Please select at least one post', 'error')
      return
    }

    if (selectedEmailLists.length === 0) {
      showSnackbar('Please select at least one email list', 'error')
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('newsletters')
        .insert({
          title,
          content: generateNewsletterContent(),
          selected_posts: selectedPosts.map(p => p.id.toString()),
          email_list_ids: selectedEmailLists,
          status,
          created_by: session?.user?.id,
        })
        .select()
        .single()

      if (error) throw error
      
      showSnackbar(`Newsletter ${status === 'draft' ? 'saved' : 'scheduled'} successfully`, 'success')
      router.push('/newsletters')
    } catch (error) {
      console.error('Error saving newsletter:', error)
      showSnackbar('Error saving newsletter', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSendNewsletter = async () => {
    if (!title.trim()) {
      showSnackbar('Please enter a newsletter title', 'error')
      return
    }

    if (selectedPosts.length === 0) {
      showSnackbar('Please select at least one post', 'error')
      return
    }

    if (selectedEmailLists.length === 0) {
      showSnackbar('Please select at least one email list', 'error')
      return
    }

    try {
      setLoading(true)
      
      // First save the newsletter as draft
      const { data: newsletter, error: saveError } = await supabase
        .from('newsletters')
        .insert({
          title,
          content: generateNewsletterContent(),
          selected_posts: selectedPosts.map(p => p.id.toString()),
          email_list_ids: selectedEmailLists,
          status: 'draft',
          created_by: session?.user?.id,
        })
        .select()
        .single()

      if (saveError) throw saveError

      // Then send the newsletter
      const response = await fetch(`/api/newsletters/send/${newsletter.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (response.ok) {
        showSnackbar(result.message, 'success')
        router.push('/newsletters')
      } else {
        showSnackbar(result.message || 'Error sending newsletter', 'error')
      }
    } catch (error) {
      console.error('Error sending newsletter:', error)
      showSnackbar('Error sending newsletter', 'error')
    } finally {
      setLoading(false)
    }
  }

  const generateNewsletterContent = () => {
    // Function to limit text to specified number of words
    const limitWords = (text: string, wordLimit: number): string => {
      const cleanText = stripHtmlTags(text).trim()
      const words = cleanText.split(/\s+/).filter(word => word.length > 0)
      
      if (words.length <= wordLimit) {
        return cleanText
      }
      return words.slice(0, wordLimit).join(' ') + '...'
    }

    return JSON.stringify({
      posts: selectedPosts.map(post => ({
        id: post.id,
        title: post.title.rendered,
        excerpt: limitWords(post.excerpt.rendered, 35),
        link: post.link,
        featured_image: getFeaturedImage(post),
        categories: getCategoryNames(post),
        date: post.date,
      }))
    })
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => router.back()}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1">
              Create Newsletter
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Newsletter Details
                  </Typography>
                  <TextField
                    fullWidth
                    label="Newsletter Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Email Lists</InputLabel>
                    <Select
                      multiple
                      value={selectedEmailLists}
                      onChange={handleEmailListChange}
                      input={<OutlinedInput label="Email Lists" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const list = emailLists.find(list => list.id === value)
                            return (
                              <Chip key={value} label={list?.name || value} size="small" />
                            )
                          })}
                        </Box>
                      )}
                    >
                      {emailLists.map((list) => (
                        <MenuItem key={list.id} value={list.id}>
                          <Checkbox checked={selectedEmailLists.indexOf(list.id) > -1} />
                          {list.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Select Posts from Archalley.com
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Choose the blog posts you want to include in your newsletter
                  </Typography>
                  
                  {loading ? (
                    <Typography>Loading posts...</Typography>
                  ) : (
                    <Grid container spacing={2}>
                      {wordpressPosts.map((post) => (
                        <Grid item xs={12} key={post.id}>
                          <Paper
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              border: selectedPosts.some(p => p.id === post.id) ? 2 : 1,
                              borderColor: selectedPosts.some(p => p.id === post.id) ? 'primary.main' : 'divider',
                              '&:hover': {
                                boxShadow: 2,
                              },
                            }}
                            onClick={() => handlePostSelection(post)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={selectedPosts.some(p => p.id === post.id)}
                                    onChange={() => handlePostSelection(post)}
                                  />
                                }
                                label=""
                                sx={{ m: 0 }}
                              />
                              {getFeaturedImage(post) && (
                                <Avatar
                                  src={getFeaturedImage(post) || ''}
                                  variant="rounded"
                                  sx={{ width: 60, height: 60 }}
                                >
                                  <ImageIcon />
                                </Avatar>
                              )}
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
                                  {stripHtmlTags(post.title.rendered)}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                  {getCategoryNames(post).map((category) => (
                                    <Chip key={category} label={category} size="small" variant="outlined" />
                                  ))}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {new Date(post.date).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}>
                                  {stripHtmlTags(post.excerpt.rendered)}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ position: 'sticky', top: 100 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Newsletter Summary
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Selected Posts: {selectedPosts.length}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 3 }}>
                    Email Lists: {selectedEmailLists.length}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<SaveIcon />}
                      onClick={() => handleSave('draft')}
                      disabled={loading}
                      fullWidth
                    >
                      Save as Draft
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleSendNewsletter}
                      disabled={loading}
                      fullWidth
                    >
                      Send Newsletter
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

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
