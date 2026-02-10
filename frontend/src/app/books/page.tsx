'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Card,
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Rating,
  TextField,
  InputAdornment,
  IconButton,
  Pagination,
  Chip,
} from '@mui/material';
import {
  Add,
  Search,
  Clear,
  MenuBook,
  ArrowForward,
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
  feedbacks?: { id: string; rating: number; comment: string }[];
}

const BOOK_COLORS = [
  'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
  'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
  'linear-gradient(135deg, #43E97B 0%, #38F9D7 100%)',
  'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)',
  'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)',
  'linear-gradient(135deg, #FCCB90 0%, #D57EEB 100%)',
  'linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%)',
];

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [searchISBN, setSearchISBN] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { isAuthenticated, user } = useAuth();

  const fetchBooks = useCallback(async (title?: string, author?: string, isbn?: string) => {
    const searchTitleValue = title !== undefined ? title : searchTitle;
    const searchAuthorValue = author !== undefined ? author : searchAuthor;
    const searchISBNValue = isbn !== undefined ? isbn : searchISBN;
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTitleValue) params.append('title', searchTitleValue);
      if (searchAuthorValue) params.append('author', searchAuthorValue);
      if (searchISBNValue) params.append('isbn', searchISBNValue);
      params.append('page', page.toString());
      params.append('limit', '9');

      const res = await apiClient.get(`/books?${params.toString()}`);
      let fetchedBooks = res.data.data || [];

      if (tab === 1) {
        fetchedBooks = [...fetchedBooks].sort(
          (a: Book, b: Book) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      } else if (tab === 2) {
        fetchedBooks = [...fetchedBooks].sort(
          (a: Book, b: Book) => (b.feedbacks?.length || 0) - (a.feedbacks?.length || 0),
        );
      }

      setBooks(fetchedBooks);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading books');
    } finally {
      setLoading(false);
    }
  }, [page, tab]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleSearch = () => {
    setPage(1);
    fetchBooks(searchTitle, searchAuthor, searchISBN);
  };

  const handleClearFilters = () => {
    setSearchTitle('');
    setSearchAuthor('');
    setSearchISBN('');
    setTab(0);
    setPage(1);
    fetchBooks('', '', '');
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getInitials = (title: string) => {
    const words = title.split(' ').filter((w) => w.length > 0);
    return words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : title.substring(0, 2).toUpperCase();
  };

  const avgRating = (book: Book) => {
    if (!book.feedbacks?.length) return 0;
    return book.feedbacks.reduce((sum, f) => sum + f.rating, 0) / book.feedbacks.length;
  };

  const getBookColor = (index: number) => BOOK_COLORS[index % BOOK_COLORS.length];

  const hasActiveSearch = searchTitle || searchAuthor || searchISBN;

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={36} sx={{ color: '#6366F1' }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading books...
          </Typography>
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Box sx={{ p: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          <Button onClick={() => window.location.reload()} variant="outlined" size="small">
            Retry
          </Button>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              Library
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {total} books in your collection
            </Typography>
          </Box>

          {user?.role?.name === 'ADMIN' && (
            <Button
              component={Link}
              href="/books/new"
              variant="contained"
              startIcon={<Add />}
              sx={{
                backgroundColor: '#6366F1',
                px: 3,
                '&:hover': { backgroundColor: '#4F46E5' },
              }}
            >
              Add Book
            </Button>
          )}
        </Box>

        <Card sx={{ mb: 3, p: { xs: 2, sm: 2.5 }, backgroundColor: '#FFFFFF' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1.5,
              alignItems: { md: 'center' },
            }}
          >
            <TextField
              placeholder="Title..."
              size="small"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { backgroundColor: '#F8FAFC' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#94A3B8', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchTitle ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchTitle('')} size="small">
                      <Clear sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <TextField
              placeholder="Author..."
              size="small"
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { backgroundColor: '#F8FAFC' } }}
              InputProps={{
                endAdornment: searchAuthor ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchAuthor('')} size="small">
                      <Clear sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <TextField
              placeholder="ISBN..."
              size="small"
              value={searchISBN}
              onChange={(e) => setSearchISBN(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { backgroundColor: '#F8FAFC' } }}
              InputProps={{
                endAdornment: searchISBN ? (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setSearchISBN('')} size="small">
                      <Clear sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <Button
                variant="contained"
                onClick={handleSearch}
                sx={{
                  backgroundColor: '#0F172A',
                  minWidth: 100,
                  '&:hover': { backgroundColor: '#1E293B' },
                }}
              >
                Search
              </Button>
              {hasActiveSearch && (
                <Button variant="text" onClick={handleClearFilters} sx={{ color: '#64748B' }}>
                  Clear
                </Button>
              )}
            </Box>
          </Box>
        </Card>

        <Box sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(_e, v) => { setTab(v); setPage(1); }} variant="scrollable" scrollButtons="auto">
            <Tab label="All Books" />
            <Tab label="Recently Added" />
            <Tab label="Most Reviewed" />
          </Tabs>
        </Box>

        {books.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <MenuBook sx={{ fontSize: 56, color: '#CBD5E1', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} gutterBottom>
              No books found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {hasActiveSearch ? 'Try adjusting your search filters' : 'Start by adding your first book'}
            </Typography>
            {user?.role?.name === 'ADMIN' && !hasActiveSearch && (
              <Button component={Link} href="/books/new" variant="contained" startIcon={<Add />}
                sx={{ backgroundColor: '#6366F1', '&:hover': { backgroundColor: '#4F46E5' } }}>
                Add First Book
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  lg: 'repeat(3, 1fr)',
                },
                gap: 2.5,
              }}
            >
              {books.map((book, index) => (
                <Card
                  key={book.id}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px -4px rgb(0 0 0 / 0.12)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: 120,
                      background: getBookColor(index),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                    }}
                  >
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.9)',
                        fontWeight: 800,
                        fontSize: '2rem',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {getInitials(book.title)}
                    </Typography>
                    {book.feedbacks && book.feedbacks.length > 0 && (
                      <Chip
                        label={`${avgRating(book).toFixed(1)} ★`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          backgroundColor: 'rgba(0,0,0,0.35)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.7rem',
                          backdropFilter: 'blur(8px)',
                          height: 24,
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      color="text.primary"
                      sx={{
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.35,
                        minHeight: '2.7em',
                      }}
                    >
                      {book.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {book.author}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.55,
                        opacity: 0.8,
                        fontSize: '0.8rem',
                      }}
                    >
                      {book.description || 'No description available.'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {book.feedbacks && book.feedbacks.length > 0 ? (
                        <>
                          <Rating value={avgRating(book)} precision={0.5} readOnly size="small" />
                          <Typography variant="caption" color="text.secondary">
                            ({book.feedbacks.length})
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No reviews yet
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                        {formatDate(book.publishedAt)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                      <Button
                        component={Link}
                        href={`/books/${book.id}`}
                        variant="outlined"
                        fullWidth
                        size="small"
                        endIcon={<ArrowForward sx={{ fontSize: '14px !important' }} />}
                      >
                        View Details
                      </Button>
                      {isAuthenticated && (
                        <Button
                          component={Link}
                          href={`/books/${book.id}/feedback`}
                          variant="contained"
                          fullWidth
                          size="small"
                          sx={{
                            backgroundColor: '#6366F1',
                            '&:hover': { backgroundColor: '#4F46E5' },
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>

            {totalPages > 1 && (
              <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {books.length} of {total}
                </Typography>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_e, v) => { setPage(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}
