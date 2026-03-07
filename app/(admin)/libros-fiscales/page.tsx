'use client'

import React from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import LogoutIcon from '@mui/icons-material/Logout'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import PrintIcon from '@mui/icons-material/Print'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'

export default function LibrosFiscalesPage() {
    const router = useRouter()
    const [searchMode, setSearchMode] = React.useState(0) // 0: Serial, 1: RIF
    const [query, setQuery] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<any>(null)
    const [userEmail, setUserEmail] = React.useState<string | null>(null)

    React.useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserEmail(user.email ?? null)
        }
        fetchUser()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResults(null)

        // Mock Data Dictionary
        const MOCK_DATA = {
            serial: {
                'AEG0001': { serial: 'AEG0001', model: 'AEG-P80', status: 'Activo', lastAudit: '2025-12-10' },
                'AEG0002': { serial: 'AEG0002', model: 'AEG-T200', status: 'En Mantenimiento', lastAudit: '2026-01-15' },
                'AEG0003': { serial: 'AEG0003', model: 'AEG-T200', status: 'Activo', lastAudit: '2026-02-20' },
            },
            rif: {
                'J123456780': [
                    { serial: 'AEG0001', model: 'AEG-P80' },
                    { serial: 'AEG0002', model: 'AEG-T200' },
                ],
                'G200012341': [
                    { serial: 'AEG0003', model: 'AEG-T200' },
                ]
            }
        }

        // Simulate Search
        setTimeout(() => {
            setLoading(false)
            if (searchMode === 0) {
                // Serial Search
                const found = MOCK_DATA.serial[query as keyof typeof MOCK_DATA.serial]
                if (found) {
                    setResults({ type: 'single', data: found })
                } else {
                    setResults({ type: 'empty', message: `No se encontró ningún equipo con el serial ${query}` })
                }
            } else {
                // RIF Search
                const found = MOCK_DATA.rif[query as keyof typeof MOCK_DATA.rif]
                if (found) {
                    setResults({ type: 'list', data: found })
                } else {
                    setResults({ type: 'empty', message: `No hay equipos registrados para el RIF ${query}` })
                }
            }
        }, 800)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
        setQuery(value)
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                p: 2,
                pt: 8, // Added padding to clear the top bar area
                position: 'relative'
            }}
        >
            {/* Minimalist Actions */}
            <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 1 }}>
                {userEmail && (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontWeight: 500 }}>
                        {userEmail}
                    </Typography>
                )}
                <IconButton onClick={handleLogout} title="Cerrar sesión" size="small">
                    <LogoutIcon fontSize="small" />
                </IconButton>
            </Box>

            <Paper
                elevation={2}
                sx={{
                    width: '100%',
                    maxWidth: 500, // Reduced from 600
                    p: 4,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <PrintIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Buscador Fiscal
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Consulta técnica de equipos y libros
                        </Typography>
                    </Box>
                </Box>

                <Tabs
                    value={searchMode}
                    onChange={(_, val) => { setSearchMode(val); setResults(null); setQuery(''); }}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Por Serial" />
                    <Tab label="Por RIF" />
                </Tabs>

                <Box component="form" onSubmit={handleSearch} noValidate sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        size="medium"
                        label={searchMode === 0 ? "Serial del Equipo" : "RIF de la Empresa"}
                        placeholder={searchMode === 0 ? "ej: AEG0001" : "ej: J123456780"}
                        value={query}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !query}
                        sx={{ minWidth: 120 }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Consultar'}
                    </Button>
                </Box>

                {results && (
                    <Box sx={{ mt: 2 }}>
                        <Divider sx={{ mb: 2 }} />
                        {results.type === 'empty' ? (
                            <Alert severity="warning" variant="outlined">
                                {results.message}
                            </Alert>
                        ) : results.type === 'single' ? (
                            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="primary" gutterBottom>
                                    Equipo Encontrado
                                </Typography>
                                <Typography variant="body1"><strong>Serial:</strong> {results.data.serial}</Typography>
                                <Typography variant="body2"><strong>Modelo:</strong> {results.data.model}</Typography>
                                <Typography variant="body2"><strong>Status:</strong> {results.data.status}</Typography>
                                <Typography variant="body2" color="text.secondary"><strong>Última Auditoría:</strong> {results.data.lastAudit}</Typography>
                                <Button
                                    size="small"
                                    sx={{ mt: 1 }}
                                    onClick={() => router.push(`/libros-fiscales/${results.data.serial}`)}
                                >
                                    Ver Libros Fiscales
                                </Button>
                            </Box>
                        ) : (
                            <List disablePadding>
                                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, px: 2 }}>
                                    Equipos Asociados al RIF
                                </Typography>
                                {results.data.map((item: any) => (
                                    <ListItem key={item.serial} divider sx={{ px: 2 }}>
                                        <ListItemText
                                            primary={item.serial}
                                            secondary={item.model}
                                        />
                                        <Button
                                            size="small"
                                            onClick={() => router.push(`/libros-fiscales/${item.serial}`)}
                                        >
                                            Ver
                                        </Button>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Box>
                )}

                <Alert severity="info" variant="outlined" sx={{ mt: results ? 0 : 2 }}>
                    Toda consulta queda registrada en la bitácora de auditoría.
                </Alert>
            </Paper>
        </Box >
    )
}
