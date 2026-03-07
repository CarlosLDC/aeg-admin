'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import PrintIcon from '@mui/icons-material/Print'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const router = useRouter()
    const [tabValue, setTabValue] = React.useState(0)

    // Auth States (Shared)
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [showPassword, setShowPassword] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const supabase = createClient()
        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(
                error.message === 'Invalid login credentials'
                    ? 'Correo o contraseña incorrectos.'
                    : error.message
            )
            setLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue)
        setError(null) // Clear errors when switching tabs
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
            }}
        >
            <Paper
                elevation={3}
                sx={{
                    width: '100%',
                    maxWidth: 450,
                    p: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    overflow: 'hidden',
                    borderRadius: 2
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        py: 4,
                        px: 4,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        bgcolor: tabValue === 0 ? 'primary.main' : 'error.main',
                        color: 'white',
                        transition: 'background-color 0.3s'
                    }}
                >
                    {tabValue === 0 ? (
                        <PrintIcon sx={{ fontSize: 48, mb: 1 }} />
                    ) : (
                        <VerifiedUserIcon sx={{ fontSize: 48, mb: 1 }} />
                    )}
                    <Typography variant="h5" component="h1" fontWeight="bold">
                        AEG Admin
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {tabValue === 0 ? 'Distribuidora de Impresoras Fiscales' : 'Módulo de Auditoría SENIAT'}
                    </Typography>
                </Box>

                <Box sx={{ width: '100%', p: 4 }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant="fullWidth"
                            sx={{
                                '& .MuiTabs-indicator': {
                                    backgroundColor: tabValue === 0 ? 'primary.main' : 'error.main',
                                },
                            }}
                        >
                            <Tab
                                label="Administración"
                                icon={<LockOutlinedIcon />}
                                iconPosition="start"
                                sx={{
                                    '&.Mui-selected': {
                                        color: 'primary.main',
                                    },
                                }}
                            />
                            <Tab
                                label="Auditores"
                                icon={<VerifiedUserIcon />}
                                iconPosition="start"
                                sx={{
                                    '&.Mui-selected': {
                                        color: 'error.main',
                                    },
                                }}
                            />
                        </Tabs>
                    </Box>

                    {/* Shared Login Form Structure - Adaptive height */}
                    <Box component="form" onSubmit={handleLoginSubmit} noValidate sx={{ mt: 3, width: '100%' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {tabValue === 0
                                ? 'Acceso para personal administrativo y de soporte.'
                                : 'Acceso restringido para auditores fiscales y entes externos certificados.'}
                        </Typography>

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
                            fullWidth
                            label="Correo electrónico"
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            autoComplete="email"
                            color={tabValue === 0 ? 'primary' : 'error'}
                        />

                        <TextField
                            fullWidth
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            autoComplete="current-password"
                            color={tabValue === 0 ? 'primary' : 'error'}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            color={tabValue === 0 ? 'primary' : 'error'}
                            disabled={loading || !email || !password}
                            sx={{ mt: 3, mb: 2 }}
                        >
                            {loading ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                tabValue === 0 ? 'Iniciar sesión' : 'Comenzar Auditoría'
                            )}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    )
}
