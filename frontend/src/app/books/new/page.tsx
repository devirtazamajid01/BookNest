'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Typography, Box, Card, TextField, Button, Alert } from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';

export default function NewBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    publishedAt: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/books', {
        ...formData,
        publishedAt: formData.publishedAt
          ? new Date(formData.publishedAt).toISOString()
          : null,
      });
      router.push('/books');
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to create book'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 800, mx: 'auto' }}>
        <Button
          component={Link}
          href="/books"
          variant="outlined"
          startIcon={<ArrowBack />}
          sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
        >
          Back to Books
        </Button>

        <Card
          sx={{
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h4"
              fontWeight={700}
              color="text.primary"
              sx={{
                mb: 3,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
              }}
            >
              Add New Book
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Book Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Author Name"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="ISBN"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                required
                placeholder="978-0-123456-78-9"
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Published Date"
                name="publishedAt"
                type="date"
                value={formData.publishedAt}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                placeholder="Enter book description..."
                sx={{ mb: 4 }}
              />

              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={<Save />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    backgroundColor: '#6366F1',
                    '&:hover': { backgroundColor: '#4F46E5' },
                  }}
                >
                  {loading ? 'Creating...' : 'Create Book'}
                </Button>
                <Button
                  component={Link}
                  href="/books"
                  variant="outlined"
                  size="large"
                  fullWidth
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>
    </DashboardLayout>
  );
}
