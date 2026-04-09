'use client';

import { Box, AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem } from '@mui/material';
import { Book as BookIcon, Menu as MenuIcon } from '@mui/icons-material';
import Link from 'next/link';
import { useState } from 'react';

export default function PublicNavbar() {
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);

  return (
    <AppBar position="static" sx={{ backgroundColor: '#0F172A' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BookIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} color="white" sx={{ fontSize: '1.05rem' }}>
              BookNest
            </Typography>
          </Box>
        </Link>

        <Box display="flex" alignItems="center" gap={1.5}>
          <Link href="/#features" style={{ textDecoration: 'none' }}>
            <Typography
              color="rgba(255,255,255,0.7)"
              sx={{
                '&:hover': { color: 'white' },
                display: { xs: 'none', md: 'block' },
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'color 0.15s',
              }}
            >
              Features
            </Typography>
          </Link>
          <Button
            component={Link}
            href="/auth/login"
            variant="outlined"
            size="small"
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontSize: '0.8125rem',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.4)',
                backgroundColor: 'rgba(255,255,255,0.06)',
              },
            }}
          >
            Sign In
          </Button>
          <Button
            component={Link}
            href="/auth/signup"
            variant="contained"
            size="small"
            sx={{
              backgroundColor: '#6366F1',
              fontSize: '0.8125rem',
              '&:hover': { backgroundColor: '#4F46E5' },
            }}
          >
            Get Started
          </Button>

          <IconButton
            color="inherit"
            onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
            sx={{ display: { xs: 'flex', md: 'none' }, ml: 0.5 }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={() => setMobileMenuAnchor(null)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <MenuItem onClick={() => setMobileMenuAnchor(null)}>
          <Link href="/#features" style={{ textDecoration: 'none', color: 'inherit' }}>
            Features
          </Link>
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
