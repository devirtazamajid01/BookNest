'use client';

import { ReactNode, useState } from 'react';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  Button,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Book as BookIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  Menu as MenuIcon,
  RateReview as FeedbackIcon,
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const DRAWER_WIDTH = 264;

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { text: 'Books', icon: <BookIcon />, href: '/books' },
    { text: 'My Feedback', icon: <FeedbackIcon />, href: '/my-feedback' },
    ...(user?.role?.name === 'ADMIN'
      ? [
          { text: 'Manage Users', icon: <PeopleIcon />, href: '/admin/users' },
          { text: 'Moderate Reviews', icon: <AdminIcon />, href: '/admin/feedback' },
        ]
      : []),
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 3, py: 2.5 }}>
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
            BookPortal
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mx: 2 }} />

      <List sx={{ flexGrow: 1, px: 1.5, py: 2 }}>
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  px: 1.5,
                  color: active ? 'white' : 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  '&:hover': {
                    backgroundColor: active
                      ? 'rgba(99, 102, 241, 0.25)'
                      : 'rgba(255, 255, 255, 0.06)',
                    color: 'white',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? '#818CF8' : 'rgba(255, 255, 255, 0.45)',
                    minWidth: 36,
                    '& .MuiSvgIcon-root': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: active ? 600 : 500,
                    fontSize: '0.875rem',
                  }}
                />
                {active && (
                  <Box
                    sx={{
                      width: 4,
                      height: 20,
                      borderRadius: 2,
                      backgroundColor: '#818CF8',
                      ml: 1,
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mx: 2 }} />

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 1.5,
            px: 0.5,
          }}
        >
          <Avatar
            sx={{
              bgcolor: '#6366F1',
              width: 36,
              height: 36,
              fontSize: '0.8rem',
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              color="white"
              fontWeight={600}
              noWrap
              sx={{ fontSize: '0.8125rem' }}
            >
              {user?.name}
            </Typography>
            <Chip
              label={user?.role.name}
              size="small"
              sx={{
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                color: '#C7D2FE',
                fontSize: '0.625rem',
                height: 18,
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>
        <Button
          onClick={logout}
          startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
          fullWidth
          sx={{
            color: 'rgba(255, 255, 255, 0.55)',
            borderColor: 'rgba(255, 255, 255, 0.12)',
            fontSize: '0.8125rem',
            py: 0.75,
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.25)',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: 'rgba(255, 255, 255, 0.85)',
            },
          }}
          variant="outlined"
          size="small"
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  const drawerPaperSx = {
    boxSizing: 'border-box',
    width: DRAWER_WIDTH,
    backgroundColor: '#0F172A',
    borderRight: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: 0,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': drawerPaperSx,
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
        }}
      >
        <AppBar
          position="sticky"
          sx={{
            display: { xs: 'block', md: 'none' },
            backgroundColor: '#0F172A',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56 } }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookIcon sx={{ color: '#818CF8', fontSize: 22 }} />
              <Typography variant="h6" noWrap fontWeight={700} sx={{ fontSize: '1rem' }}>
                BookPortal
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>
        {children}
      </Box>
    </Box>
  );
}
