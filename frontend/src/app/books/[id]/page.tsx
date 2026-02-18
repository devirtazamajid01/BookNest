'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Card,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Rating,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  RateReview,
  CalendarMonth,
  Tag,
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  description: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.id as string;
  const [book, setBook] = useState<Book | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (bookId) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookRes, feedbackRes] = await Promise.all([
        apiClient.get(`/books/${bookId}`),
        apiClient
          .get(`/feedback/book/${bookId}?isApproved=true`)
          .catch(() => ({ data: { data: [] } })),
      ]);

      setBook(bookRes.data);
      setFeedback(feedbackRes.data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      await apiClient.delete(`/books/${bookId}`);
      router.push('/books');
    } catch {
      alert('Failed to delete book');
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const avgRating = () => {
    if (!feedback.length) return 0;
    return feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Loading book...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  if (error || !book) {
    return (
      <DashboardLayout>
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Book not found'}
          </Alert>
          <Button
            component={Link}
            href="/books"
            variant="outlined"
            startIcon={<ArrowBack />}
          >
            Back to Books
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
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
            mb: 4,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'flex-start' },
                mb: 3,
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  fontWeight={700}
                  color="text.primary"
                  sx={{
                    mb: 1,
                    fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                  }}
                >
                  {book.title}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    mb: 2,
                    fontSize: { xs: '0.95rem', sm: '1rem', md: '1.125rem' },
                  }}
                >
                  by {book.author}
                </Typography>
                {feedback.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Rating
                      value={avgRating()}
                      precision={0.5}
                      readOnly
                      size="small"
                      sx={{ color: '#f59e0b' }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
                    >
                      {avgRating().toFixed(1)} ({feedback.length} review
                      {feedback.length !== 1 ? 's' : ''})
                    </Typography>
                  </Box>
                )}
              </Box>
              {user?.role?.name === 'ADMIN' && (
                <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  <Button
                    component={Link}
                    href={`/books/${bookId}/edit`}
                    variant="outlined"
                    size="small"
                    startIcon={<Edit />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      px: { xs: 1.5, sm: 2 },
                      borderColor: '#6366F1',
                      color: '#6366F1',
                      '&:hover': {
                        borderColor: '#4F46E5',
                        backgroundColor: 'rgba(59, 130, 246, 0.04)',
                      },
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Delete />}
                    onClick={handleDelete}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      px: { xs: 1.5, sm: 2 },
                      borderColor: '#ef4444',
                      color: '#ef4444',
                      '&:hover': {
                        borderColor: '#dc2626',
                        backgroundColor: 'rgba(239, 68, 68, 0.04)',
                      },
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1.5, sm: 2 },
                mb: 3,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth
                  sx={{ fontSize: { xs: 18, sm: 20 }, color: '#6366F1' }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
                >
                  {formatDate(book.publishedAt)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Tag sx={{ fontSize: { xs: 18, sm: 20 }, color: '#6366F1' }} />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  }}
                >
                  ISBN: {book.isbn}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: { xs: 2, sm: 3 } }} />

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                lineHeight: 1.8,
                fontSize: { xs: '0.875rem', sm: '0.95rem', md: '1rem' },
              }}
            >
              {book.description || 'No description available for this book.'}
            </Typography>
          </Box>
        </Card>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            mb: 3,
            gap: 2,
          }}
        >
          <Typography
            variant="h5"
            fontWeight={700}
            color="text.primary"
            sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' } }}
          >
            Reviews
          </Typography>
          <Button
            component={Link}
            href={`/books/${bookId}/feedback`}
            variant="contained"
            startIcon={<RateReview sx={{ fontSize: { xs: 18, sm: 20 } }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '0.95rem' },
              py: { xs: 1, sm: 1.25 },
              backgroundColor: '#6366F1',
              '&:hover': { backgroundColor: '#4F46E5' },
            }}
          >
            Add Review
          </Button>
        </Box>

        {feedback.length === 0 ? (
          <Card
            sx={{
              textAlign: 'center',
              py: 6,
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No reviews yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Be the first to share your thoughts about this book
            </Typography>
          </Card>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, sm: 2.5 },
            }}
          >
            {feedback.map((review) => (
              <Card
                key={review.id}
                sx={{
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', sm: 'flex-start' },
                      mb: 2,
                      gap: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          backgroundColor: '#6366F1',
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                        }}
                      >
                        {review.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          color="text.primary"
                          sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
                        >
                          {review.user.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        >
                          {new Date(review.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            }
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      sx={{ color: '#f59e0b' }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.7,
                      fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    }}
                  >
                    {review.comment}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
}
