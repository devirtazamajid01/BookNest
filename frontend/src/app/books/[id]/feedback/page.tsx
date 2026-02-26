'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Card,
  TextField,
  Button,
  Rating,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { ArrowBack, Send } from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string | null;
  publishedAt: string | null;
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    if (bookId) fetchBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, isAuthenticated, router]);

  const fetchBook = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/books/${bookId}`);
      setBook(res.data);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.message || error.message || 'Failed to load book'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.length < 10) {
      setError('Comment must be at least 10 characters');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await apiClient.post('/feedback', {
        bookId,
        rating,
        comment,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/books/${bookId}`);
      }, 1500);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to submit review'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

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

  if (success) {
    return (
      <DashboardLayout>
        <Box
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            maxWidth: 600,
            mx: 'auto',
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Card
            sx={{
              width: '100%',
              textAlign: 'center',
              py: 6,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <Box sx={{ p: 3 }}>
              <Typography
                variant="h5"
                fontWeight={700}
                color="#10b981"
                gutterBottom
              >
                Review Submitted!
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                Thank you for your feedback. Your review will be visible once
                approved by moderators.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Redirecting...
              </Typography>
            </Box>
          </Card>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 700, mx: 'auto' }}>
        <Button
          component={Link}
          href={`/books/${bookId}`}
          variant="outlined"
          startIcon={<ArrowBack />}
          sx={{ mb: 3, textTransform: 'none', fontWeight: 600 }}
        >
          Back to Book
        </Button>

        {book && (
          <Card
            sx={{
              mb: 3,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: '#6366F1',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                }}
              >
                {book.title.substring(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                  {book.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  by {book.author}
                </Typography>
              </Box>
            </Box>
          </Card>
        )}

        <Card
          sx={{
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography
              variant="h5"
              fontWeight={700}
              color="text.primary"
              sx={{ mb: 3, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
            >
              Write Your Review
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  color="text.primary"
                  gutterBottom
                >
                  Your Rating *
                </Typography>
                <Rating
                  value={rating}
                  onChange={(_, val) => setRating(val || 0)}
                  size="large"
                  sx={{
                    color: '#f59e0b',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                  }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={6}
                label="Your Review"
                placeholder="Share your thoughts about this book..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                helperText={`${comment.length}/500 characters (minimum 10)`}
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
                  disabled={submitting}
                  startIcon={<Send />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                    backgroundColor: '#6366F1',
                    '&:hover': { backgroundColor: '#4F46E5' },
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
                <Button
                  component={Link}
                  href={`/books/${bookId}`}
                  variant="outlined"
                  size="large"
                  fullWidth
                  disabled={submitting}
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
