'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Rating,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
  };
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user?.role?.name !== 'ADMIN') {
      router.push('/books');
      return;
    }
    fetchFeedbacks();
  }, [user, router]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/feedback');
      setFeedbacks(res.data.data || []);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        error.response?.data?.message ||
          error.message ||
          'Failed to load feedback'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiClient.patch(`/feedback/${id}`, { isApproved: true });
      setFeedbacks(
        feedbacks.map((f) => (f.id === id ? { ...f, isApproved: true } : f))
      );
    } catch {
      alert('Failed to approve feedback');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await apiClient.delete(`/feedback/${id}`);
      setFeedbacks(feedbacks.filter((f) => f.id !== id));
    } catch {
      alert('Failed to delete feedback');
    }
  };

  const filteredFeedbacks =
    tab === 0
      ? feedbacks
      : tab === 1
        ? feedbacks.filter((f) => !f.isApproved)
        : feedbacks.filter((f) => f.isApproved);

  if (user?.role?.name !== 'ADMIN') return null;

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
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography
          variant="h4"
          fontWeight={700}
          color="text.primary"
          sx={{ mb: 1, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
        >
          Moderate Reviews
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ mb: 4, fontSize: { xs: '0.875rem', sm: '1rem' } }}
        >
          Approve or reject user reviews
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Tabs
            value={tab}
            onChange={(e, val) => setTab(val)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: '0.875rem', sm: '0.95rem' },
                '&.Mui-selected': { color: '#6366F1' },
              },
              '& .MuiTabs-indicator': { backgroundColor: '#6366F1' },
            }}
          >
            <Tab label={`All (${feedbacks.length})`} />
            <Tab
              label={`Pending (${feedbacks.filter((f) => !f.isApproved).length})`}
            />
            <Tab
              label={`Approved (${feedbacks.filter((f) => f.isApproved).length})`}
            />
          </Tabs>
        </Box>

        {filteredFeedbacks.length === 0 ? (
          <Card
            sx={{
              textAlign: 'center',
              py: 6,
              border: '1px solid #e2e8f0',
              boxShadow: 'none',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              {tab === 1
                ? 'No pending reviews'
                : tab === 2
                  ? 'No approved reviews'
                  : 'No reviews yet'}
            </Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredFeedbacks.map((feedback) => (
              <Card
                key={feedback.id}
                sx={{
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: '#6366F1',
                        }}
                      >
                        {feedback.user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={600}
                          color="text.primary"
                          sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
                        >
                          {feedback.user.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        >
                          {new Date(feedback.createdAt).toLocaleDateString(
                            'en-US',
                            { month: 'long', day: 'numeric', year: 'numeric' }
                          )}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Rating
                        value={feedback.rating}
                        readOnly
                        size="small"
                        sx={{ color: '#f59e0b' }}
                      />
                      {feedback.isApproved ? (
                        <Chip
                          label="Approved"
                          size="small"
                          sx={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Chip
                          label="Pending"
                          size="small"
                          sx={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mb: 2,
                      p: 2,
                      backgroundColor: '#f7fafc',
                      borderRadius: 2,
                      borderLeft: '3px solid #6366F1',
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="#64748B"
                      sx={{
                        textTransform: 'uppercase',
                        fontSize: '0.7rem',
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      Book
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="text.primary"
                    >
                      {feedback.book.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {feedback.book.author}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      lineHeight: 1.7,
                      mb: 2,
                      fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    }}
                  >
                    {feedback.comment}
                  </Typography>

                  {!feedback.isApproved && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.5,
                        flexDirection: { xs: 'column', sm: 'row' },
                      }}
                    >
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CheckCircle />}
                        onClick={() => handleApprove(feedback.id)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                          backgroundColor: '#10b981',
                          '&:hover': { backgroundColor: '#059669' },
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<Cancel />}
                        onClick={() => handleReject(feedback.id)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: { xs: '0.875rem', sm: '0.95rem' },
                          borderColor: '#ef4444',
                          color: '#ef4444',
                          '&:hover': {
                            borderColor: '#dc2626',
                            backgroundColor: 'rgba(239, 68, 68, 0.04)',
                          },
                        }}
                      >
                        Reject
                      </Button>
                    </Box>
                  )}

                  {feedback.isApproved && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Cancel />}
                      onClick={() => handleReject(feedback.id)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
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
                  )}
                </Box>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </DashboardLayout>
  );
}
