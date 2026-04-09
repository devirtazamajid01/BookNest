'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Typography, Box, Button, Card, CardContent } from '@mui/material';
import {
  Search as SearchIcon,
  RateReview as RateReviewIcon,
  AdminPanelSettings as AdminIcon,
  Shield as ShieldIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';

const FEATURES = [
  {
    icon: <SearchIcon />,
    title: 'Browse Books',
    description: 'Search and filter through our curated collection with powerful filters.',
    color: '#6366F1',
  },
  {
    icon: <RateReviewIcon />,
    title: 'Leave Feedback',
    description: 'Rate and review books you\'ve read to help other readers discover great content.',
    color: '#059669',
  },
  {
    icon: <AdminIcon />,
    title: 'Admin Dashboard',
    description: 'Full control over book management, user roles, and content moderation.',
    color: '#D97706',
  },
  {
    icon: <ShieldIcon />,
    title: 'Content Moderation',
    description: 'Review and approve user feedback to maintain quality and trust.',
    color: '#DC2626',
  },
];

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/books');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'background.default',
        }}
      >
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (isAuthenticated) return null;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />

      <Box
        sx={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #1E1B4B 100%)',
          py: { xs: 8, sm: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120%',
            height: '120%',
            background: 'radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', textAlign: 'center' }}>
          <Typography
            variant="overline"
            sx={{ color: '#818CF8', mb: 2, display: 'block', letterSpacing: '0.15em' }}
          >
            BookNest
          </Typography>
          <Typography
            variant="h2"
            fontWeight={800}
            color="white"
            sx={{
              mb: 2.5,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}
          >
            Manage Your Books{' '}
            <Box component="span" sx={{ color: '#818CF8' }}>
              Smarter
            </Box>
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.65)',
              mb: 4,
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.125rem' },
              lineHeight: 1.6,
              maxWidth: 560,
              mx: 'auto',
            }}
          >
            Browse books, leave reviews, and manage your library with powerful admin tools and
            content moderation.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/auth/signup"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: '#6366F1',
                px: 4,
                py: 1.5,
                fontSize: '0.9375rem',
                '&:hover': { backgroundColor: '#4F46E5' },
              }}
            >
              Get Started Free
            </Button>
            <Button
              component={Link}
              href="/auth/login"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '0.9375rem',
                '&:hover': {
                  borderColor: 'rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                },
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      <Box id="features" sx={{ backgroundColor: 'background.default', py: { xs: 6, sm: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
            <Typography variant="overline" sx={{ color: '#6366F1', mb: 1, display: 'block' }}>
              Features
            </Typography>
            <Typography
              variant="h3"
              fontWeight={800}
              color="text.primary"
              sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } }}
            >
              Everything you need to manage books
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: 3,
            }}
          >
            {FEATURES.map((feature) => (
              <Card
                key={feature.title}
                sx={{
                  textAlign: 'center',
                  backgroundColor: 'white',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px -6px rgb(0 0 0 / 0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 3.5, '&:last-child': { pb: 3.5 } }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: `${feature.color}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2.5,
                      color: feature.color,
                      '& .MuiSvgIcon-root': { fontSize: 24 },
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight={700} color="text.primary" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      <PublicFooter />
    </Box>
  );
}
