'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Rating,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Book as BookIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  book: {
    id: string;
    title: string;
    author: string;
  };
}

export default function MyFeedbackPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<Feedback | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMyFeedback = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/feedback/my-feedback');
      // The API returns { data: [...], pagination: {...} }
      const responseData = response.data;
      const feedbacks = responseData.data || responseData;
      setFeedbacks(Array.isArray(feedbacks) ? feedbacks : []);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to fetch feedback'
      );
      setFeedbacks([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyFeedback();
    }
  }, [user]);

  const handleEditClick = (feedback: Feedback) => {
    setEditingFeedback(feedback);
    setEditRating(feedback.rating);
    setEditComment(feedback.comment);
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!editingFeedback) return;

    try {
      setSubmitting(true);
      await apiClient.patch(`/feedback/${editingFeedback.id}`, {
        rating: editRating,
        comment: editComment,
      });

      // Update the feedback in the list
      setFeedbacks((prev) =>
        prev.map((f) =>
          f.id === editingFeedback.id
            ? {
                ...f,
                rating: editRating,
                comment: editComment,
                updatedAt: new Date().toISOString(),
              }
            : f
        )
      );

      setEditDialogOpen(false);
      setEditingFeedback(null);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to update feedback'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await apiClient.delete(`/feedback/${feedbackId}`);
      setFeedbacks((prev) => prev.filter((f) => f.id !== feedbackId));
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to delete feedback'
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            color="text.primary"
            gutterBottom
          >
            My Feedback
          </Typography>
          <Typography color="text.secondary">
            View and manage your book reviews and ratings
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!Array.isArray(feedbacks) || feedbacks.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: { xs: 4, sm: 6, md: 8 },
            }}
          >
            <BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.primary" gutterBottom>
              No feedback yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Start reviewing books to see your feedback here
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: { xs: 2, sm: 3, md: 4 },
              width: '100%',
            }}
          >
            {Array.isArray(feedbacks) &&
              feedbacks.map((feedback) => (
                <Box
                  key={feedback.id}
                  sx={{
                    display: 'flex',
                    minHeight: '320px',
                    width: '100%',
                  }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      width: '100%',
                      minHeight: '320px',
                      maxWidth: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                  >
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        p: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Chip
                          label={feedback.isApproved ? 'Approved' : 'Pending'}
                          color={feedback.isApproved ? 'success' : 'warning'}
                          size="small"
                        />
                        <Box>
                          {feedback.isApproved ? (
                            <Tooltip title="View Book">
                              <IconButton
                                size="small"
                                component={Link}
                                href={`/books/${feedback.book.id}`}
                                color="primary"
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditClick(feedback)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(feedback.id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </Box>

                      <Typography
                        variant="h6"
                        fontWeight={600}
                        color="text.primary"
                        gutterBottom
                      >
                        {feedback.book.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        by {feedback.book.author}
                      </Typography>

                      <Box
                        sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                      >
                        <Rating value={feedback.rating} readOnly size="small" />
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          ({feedback.rating}/5)
                        </Typography>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                          hyphens: 'auto',
                          minHeight: '60px',
                        }}
                      >
                        {feedback.comment}
                      </Typography>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {formatDate(feedback.createdAt)}
                        {feedback.updatedAt !== feedback.createdAt && (
                          <span>
                            {' '}
                            • Updated {formatDate(feedback.updatedAt)}
                          </span>
                        )}
                      </Typography>

                      {feedback.isApproved && (
                        <Button
                          component={Link}
                          href={`/books/${feedback.book.id}`}
                          variant="outlined"
                          size="small"
                          startIcon={<ViewIcon />}
                          sx={{ mt: 'auto' }}
                          fullWidth
                        >
                          View Book
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              ))}
          </Box>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Edit Feedback</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {editingFeedback?.book.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                by {editingFeedback?.book.author}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Rating
                </Typography>
                <Rating
                  value={editRating}
                  onChange={(_, newValue) => setEditRating(newValue || 0)}
                  size="large"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comment"
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                variant="outlined"
                placeholder="Share your thoughts about this book..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              variant="contained"
              disabled={submitting || !editComment.trim() || editRating === 0}
            >
              {submitting ? <CircularProgress size={20} /> : 'Update Feedback'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </DashboardLayout>
  );
}
