'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Card,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string | null;
  publishedAt: string | null;
}

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    publishedAt: '',
  });

  useEffect(() => {
    if (bookId) fetchBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const fetchBook = async () => {
    try {
      const res = await apiClient.get(`/books/${bookId}`);
      const book: Book = res.data;

      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description || '',
        publishedAt: book.publishedAt
          ? new Date(book.publishedAt).toISOString().split('T')[0]
          : '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await apiClient.patch(`/books/${bookId}`, {
        ...formData,
        publishedAt: formData.publishedAt
          ? new Date(formData.publishedAt).toISOString()
          : null,
      });
      router.push(`/books/${bookId}`);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to update book'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 800, mx: 'auto' }}>
        <Button
          component={Link}
          href={`/books/${bookId}`}
          variant="outlined"
          startIcon={<ArrowBack />}
          sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
        >
          Back to Book
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
              Edit Book
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
                  disabled={saving}
                  startIcon={<Save />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    backgroundColor: '#6366F1',
                    '&:hover': { backgroundColor: '#4F46E5' },
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  component={Link}
                  href={`/books/${bookId}`}
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
