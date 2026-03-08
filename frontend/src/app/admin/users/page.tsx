'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Divider,
} from '@mui/material';
import {
  People,
  AdminPanelSettings,
  Person,
  Delete,
  Search,
  Visibility,
  RateReview,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
}

interface UserFeedback {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  book: {
    id: string;
    title: string;
    author: string;
  };
}

interface UserBook {
  id: string;
  title: string;
  author: string;
  isbn: string;
  createdAt: string;
}

interface FeedbackData {
  rating: number;
  isApproved: boolean;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');

      const res = await apiClient.get(`/users?${params.toString()}`);
      const userData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      setUsers(userData);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotal(res.data?.pagination?.total || userData.length);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (user?.role?.name !== 'ADMIN') {
      router.push('/books');
      return;
    }
    fetchUsers();
  }, [user, router, fetchUsers]);

  const fetchUserFeedback = async (userId: string) => {
    try {
      setFeedbackLoading(true);
      const response = await apiClient.get(`/feedback/user/${userId}`);
      setUserFeedback(response.data.data || response.data);
    } catch (err) {
      setUserFeedback([]);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      setBooksLoading(true);
      // Get user's feedback stats instead of books
      const response = await apiClient.get(`/feedback/user/${userId}`);
      const feedbacks = response.data.data || response.data;
      const approvedCount = feedbacks.filter(
        (f: FeedbackData) => f.isApproved
      ).length;
      const pendingCount = feedbacks.filter(
        (f: FeedbackData) => !f.isApproved
      ).length;
      const avgRating =
        feedbacks.length > 0
          ? (
              feedbacks.reduce(
                (sum: number, f: FeedbackData) => sum + f.rating,
                0
              ) / feedbacks.length
            ).toFixed(1)
          : 0;

      setUserBooks([
        {
          id: 'stats',
          title: `Total Feedback: ${feedbacks.length}`,
          author: `Approved: ${approvedCount} | Pending: ${pendingCount}`,
          isbn: `Average Rating: ${avgRating}/5`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setUserBooks([]);
    } finally {
      setBooksLoading(false);
    }
  };

  const handleViewUserDetails = async (user: User) => {
    setSelectedUser(user);
    setDetailsDialogOpen(true);
    await Promise.all([fetchUserFeedback(user.id), fetchUserStats(user.id)]);
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;

    try {
      await apiClient.delete(`/feedback/${feedbackId}`);
      setUserFeedback((prev) => prev.filter((f) => f.id !== feedbackId));
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to delete feedback'
      );
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await apiClient.patch(`/users/${userId}/role`, { roleId: newRole });
      setUsers(
        users.map((u) =>
          u.id === userId
            ? {
                ...u,
                roleId: newRole,
                role: { ...u.role, id: newRole, name: newRole.toUpperCase() },
              }
            : u
        )
      );
    } catch {
      alert('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === user?.email) {
      alert('You cannot delete your own account!');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await apiClient.delete(`/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
      setTotal(total - 1);
    } catch {
      alert('Failed to delete user');
    }
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          minHeight="70vh"
        >
          <CircularProgress />
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Loading users...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button onClick={fetchUsers} variant="outlined">
          Retry
        </Button>
      </DashboardLayout>
    );
  }

  const adminCount = users.filter((u) => u.role?.name === 'ADMIN').length;
  const userCount = users.filter((u) => u.role?.name === 'USER').length;

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            color="text.primary"
            sx={{
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            <People sx={{ fontSize: { xs: 28, sm: 32 }, color: '#6366F1' }} />
            User Management
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, mb: 3 }}
          >
            Manage users and assign roles
          </Typography>

          <TextField
            fullWidth
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: { xs: 2, sm: 2.5, md: 3 },
            mb: 4,
            '@media (min-width: 750px)': {
              gridTemplateColumns: 'repeat(2, 1fr)',
            },
            '@media (min-width: 1024px)': {
              gridTemplateColumns: 'repeat(3, 1fr)',
            },
          }}
        >
          <Card
            sx={{
              p: { xs: 2.5, sm: 3 },
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                mb: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              Total Users
            </Typography>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}
            >
              {total}
            </Typography>
          </Card>

          <Card
            sx={{
              p: { xs: 2.5, sm: 3 },
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                mb: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              Administrators
            </Typography>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}
            >
              {adminCount}
            </Typography>
          </Card>

          <Card
            sx={{
              p: { xs: 2.5, sm: 3 },
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                mb: 1,
                fontSize: { xs: '0.875rem', sm: '1rem' },
              }}
            >
              Regular Users
            </Typography>
            <Typography
              variant="h3"
              fontWeight={700}
              sx={{ fontSize: { xs: '2rem', sm: '2.5rem' } }}
            >
              {userCount}
            </Typography>
          </Card>
        </Box>

        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              background: 'linear-gradient(135deg, #1E1B4B 0%, #6366F1 100%)',
              color: 'white',
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              All Users ({total})
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {filteredUsers.map((u) => (
              <Card
                key={u.id}
                sx={{
                  mb: 2,
                  p: { xs: 2, sm: 2.5, md: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 2,
                  border: '1px solid',
                  borderColor: 'grey.200',
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
                    borderColor: '#6366F1',
                  },
                  '@media (min-width: 750px)': {
                    flexDirection: 'row',
                    alignItems: 'center',
                  },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flex: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 48, sm: 56 },
                      height: { xs: 48, sm: 56 },
                      backgroundColor: '#6366F1',
                      fontWeight: 700,
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                    }}
                  >
                    {getInitials(u.name)}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      sx={{
                        fontSize: { xs: '0.95rem', sm: '1.125rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.name}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.8rem', sm: '0.95rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.email}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: 'block',
                        mt: 0.5,
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      }}
                    >
                      Joined{' '}
                      {new Date(u.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: { xs: 1.5, sm: 2 },
                    width: '100%',
                    '@media (min-width: 750px)': {
                      width: 'auto',
                    },
                  }}
                >
                  <Chip
                    icon={
                      u.role?.name === 'ADMIN' ? (
                        <AdminPanelSettings
                          sx={{ fontSize: { xs: 16, sm: 18 } }}
                        />
                      ) : (
                        <Person sx={{ fontSize: { xs: 16, sm: 18 } }} />
                      )
                    }
                    label={u.role?.name || 'USER'}
                    color={u.role?.name === 'ADMIN' ? 'primary' : 'default'}
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      minWidth: { xs: 80, sm: 100 },
                    }}
                  />

                  {u.email !== user?.email && (
                    <FormControl
                      size="small"
                      sx={{
                        minWidth: { xs: 100, sm: 120 },
                        flex: { xs: '1 1 auto', sm: '0 0 auto' },
                      }}
                    >
                      <InputLabel
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        Change Role
                      </InputLabel>
                      <Select
                        value={u.roleId}
                        label="Change Role"
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                      >
                        <MenuItem
                          value="user"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          User
                        </MenuItem>
                        <MenuItem
                          value="admin"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                        >
                          Admin
                        </MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {u.email === user?.email && (
                    <Chip
                      label="You"
                      size="small"
                      sx={{
                        backgroundColor: '#6366F1',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                      }}
                    />
                  )}

                  <IconButton
                    onClick={() => handleViewUserDetails(u)}
                    size="small"
                    sx={{
                      color: '#6366F1',
                      padding: { xs: 0.75, sm: 1 },
                      '&:hover': {
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      },
                    }}
                  >
                    <Visibility sx={{ fontSize: { xs: 20, sm: 22 } }} />
                  </IconButton>

                  {u.email !== user?.email && (
                    <IconButton
                      onClick={() => handleDeleteUser(u.id, u.email)}
                      size="small"
                      sx={{
                        color: '#ef4444',
                        padding: { xs: 0.75, sm: 1 },
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        },
                      }}
                    >
                      <Delete sx={{ fontSize: { xs: 20, sm: 22 } }} />
                    </IconButton>
                  )}
                </Box>
              </Card>
            ))}

            {!loading && totalPages > 1 && (
              <Box
                sx={{
                  mt: 4,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  Showing {users.length} of {total} users
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  size="medium"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontWeight: 500,
                      '&.Mui-selected': {
                        backgroundColor: '#6366F1',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#4F46E5',
                        },
                      },
                    },
                  }}
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}

            {filteredUsers.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  {searchTerm
                    ? 'No users found matching your search'
                    : 'No users found'}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* User Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                {selectedUser?.name.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{selectedUser?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser?.email}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <RateReview />
                User Feedback ({userFeedback.length})
              </Typography>

              {feedbackLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : userFeedback.length === 0 ? (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  No feedback submitted yet
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  {userFeedback.map((feedback) => (
                    <Box key={feedback.id}>
                      <Card sx={{ p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 1,
                          }}
                        >
                          <Chip
                            label={feedback.isApproved ? 'Approved' : 'Pending'}
                            color={feedback.isApproved ? 'success' : 'warning'}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteFeedback(feedback.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {feedback.book.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          by {feedback.book.author}
                        </Typography>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', mb: 1 }}
                        >
                          <Rating
                            value={feedback.rating}
                            readOnly
                            size="small"
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            ({feedback.rating}/5)
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {feedback.comment}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </Typography>
                      </Card>
                    </Box>
                  ))}
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <AdminPanelSettings />
                User Statistics
              </Typography>

              {booksLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box
                  sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}
                >
                  {userBooks.map((stat) => (
                    <Box key={stat.id}>
                      <Card
                        sx={{
                          p: 3,
                          background:
                            'linear-gradient(135deg, #6366F1 0%, #3730A3 100%)',
                          color: 'white',
                        }}
                      >
                        <Typography
                          variant="h5"
                          fontWeight={600}
                          sx={{ mb: 1 }}
                        >
                          {stat.title}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ mb: 1, opacity: 0.9 }}
                        >
                          {stat.author}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                          {stat.isbn}
                        </Typography>
                      </Card>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
