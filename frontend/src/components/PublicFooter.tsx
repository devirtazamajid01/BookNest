'use client';

import { Box, Container, Typography } from '@mui/material';
import { Book as BookIcon } from '@mui/icons-material';

export default function PublicFooter() {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#0F172A',
        color: 'white',
        py: { xs: 4, sm: 5 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' },
            gap: { xs: 3, sm: 4 },
          }}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1,
                  background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookIcon sx={{ color: 'white', fontSize: 16 }} />
              </Box>
              <Typography variant="subtitle1" fontWeight={700}>
                BookPortal
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.6, lineHeight: 1.7, maxWidth: 320 }}>
              Browse, review, and manage your book collection with ease.
            </Typography>
          </Box>

          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', mb: 2, display: 'block' }}>
              Resources
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {['Documentation', 'Help Center', 'Privacy Policy'].map((text) => (
                <Typography
                  key={text}
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    '&:hover': { color: 'white' },
                  }}
                >
                  {text}
                </Typography>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.4)', mb: 2, display: 'block' }}>
              Company
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {['About Us', 'Contact', 'Terms of Service'].map((text) => (
                <Typography
                  key={text}
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    '&:hover': { color: 'white' },
                  }}
                >
                  {text}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            mt: 4,
            pt: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            &copy; {new Date().getFullYear()} BookPortal. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
