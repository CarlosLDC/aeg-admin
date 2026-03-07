'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import List from '@mui/material/List'
import Typography from '@mui/material/Typography'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined'
import PrintIcon from '@mui/icons-material/Print'
import LogoutIcon from '@mui/icons-material/Logout'
import GavelIcon from '@mui/icons-material/Gavel'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import { alpha } from '@mui/material/styles'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const DRAWER_WIDTH = 240

interface Profile {
    id: string
    rol: 'admin' | 'auditor' | 'usuario'
    [key: string]: any
}

interface AppShellProps {
    children: React.ReactNode
    user: User
    profile?: Profile | null
}

export default function AppShell({ children, user, profile }: AppShellProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

    const role = profile?.rol || 'usuario'

    const navItems = [
        { label: 'Dashboard', href: '/dashboard', icon: <DashboardOutlinedIcon />, roles: ['admin', 'usuario'] },
        { label: 'Libros Fiscales', href: '/libros-fiscales', icon: <PrintIcon />, roles: ['admin', 'usuario', 'auditor'] },
        { label: 'Servicios Fiscales', href: '/servicios-fiscales', icon: <GavelIcon />, roles: ['admin', 'usuario', 'auditor'] },
    ].filter(item => item.roles.includes(role))

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const initials = user.email
        ? user.email.slice(0, 2).toUpperCase()
        : 'AU'

    const isMinimalistPage = pathname?.startsWith('/libros-fiscales') || pathname?.startsWith('/servicios-fiscales')

    if (isMinimalistPage) {
        return (
            <Box component="main" sx={{ flexGrow: 1, bgcolor: '#fafafa', minHeight: '100vh' }}>
                {children}
            </Box>
        )
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="h6" noWrap component="div">
                        AEG Admin
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2">{user.email}</Typography>
                        <Tooltip title="Cerrar sesión">
                            <IconButton onClick={handleLogout} color="inherit">
                                <LogoutIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: DRAWER_WIDTH,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {navItems.map((item) => (
                            <ListItem key={item.href} disablePadding>
                                <ListItemButton
                                    component={Link}
                                    href={item.href}
                                    selected={pathname === item.href}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    <ListItemText primary={item.label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#fafafa', minHeight: '100vh' }}>
                <Toolbar />
                {children}
            </Box>
        </Box>
    )
}
