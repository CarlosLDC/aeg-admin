'use client'

import React from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import ListItemButton from '@mui/material/ListItemButton'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import PrintIcon from '@mui/icons-material/Print'
import LogoutIcon from '@mui/icons-material/Logout'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchIcon from '@mui/icons-material/Search'
import BuildIcon from '@mui/icons-material/Build'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PRINTERS, RIF_INDEX, type Printer } from '@/lib/servicios-fiscales/mock-data'

type SearchResult =
    | { type: 'empty'; message: string }
    | { type: 'single'; data: Printer }
    | { type: 'list'; data: Printer[] }

export default function ServiciosFiscalesPage() {
    const router = useRouter()
    const [searchMode, setSearchMode] = React.useState(0)
    const [query, setQuery] = React.useState('')
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<SearchResult | null>(null)
    const [userEmail, setUserEmail] = React.useState<string | null>(null)

    React.useEffect(() => {
        createClient().auth.getUser().then(({ data: { user } }) => {
            if (user) setUserEmail(user.email ?? null)
        })
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResults(null)

        setTimeout(() => {
            setLoading(false)
            if (searchMode === 0) {
                const printer = PRINTERS[query]
                if (printer) {
                    setResults({ type: 'single', data: printer })
                } else {
                    setResults({ type: 'empty', message: `No se encontró ningún equipo con el serial "${query}".` })
                }
            } else {
                const serials = RIF_INDEX[query]
                if (serials && serials.length > 0) {
                    setResults({ type: 'list', data: serials.map(s => PRINTERS[s]).filter(Boolean) })
                } else {
                    setResults({ type: 'empty', message: `No hay equipos registrados para el RIF "${query}".` })
                }
            }
        }, 600)
    }

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const statusColor = (s: string) => s === 'Activo' ? 'success' : s === 'En Mantenimiento' ? 'warning' : 'default'

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 2,
            pt: 10,
            position: 'relative'
        }}>
            {/* Top actions */}
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


            <Paper elevation={2} sx={{
                width: '100%', maxWidth: 560, p: 4, borderRadius: 3,
                display: 'flex', flexDirection: 'column', gap: 3
            }}>
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <BuildIcon color="primary" sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontSize: 8, color: 'text.secondary', lineHeight: 1 }}>SERVICIO</Typography>
                    </Box>
                    <Box sx={{ mx: 0.5, height: 28, width: 1, bgcolor: 'divider' }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <VerifiedUserIcon color="success" sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontSize: 8, color: 'text.secondary', lineHeight: 1 }}>INSPECCIÓN</Typography>
                    </Box>
                    <Box>
                        <Typography variant="h5" fontWeight="bold">Servicios Fiscales</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Buscador de servicios técnicos e inspecciones SENIAT
                        </Typography>
                    </Box>
                </Box>

                {/* Tabs */}
                <Tabs
                    value={searchMode}
                    onChange={(_, val) => { setSearchMode(val); setResults(null); setQuery('') }}
                    variant="fullWidth"
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                    <Tab label="Por Serial" icon={<PrintIcon fontSize="small" />} iconPosition="start" />
                    <Tab label="Por RIF" icon={<SearchIcon fontSize="small" />} iconPosition="start" />
                </Tabs>

                {/* Search form */}
                <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        fullWidth
                        label={searchMode === 0 ? 'Serial del Equipo' : 'RIF de la Empresa'}
                        placeholder={searchMode === 0 ? 'ej: AEG0001' : 'ej: J123456780'}
                        value={query}
                        onChange={handleInputChange}
                        disabled={loading}
                        size="medium"
                        inputProps={{ maxLength: searchMode === 0 ? 10 : 12 }}
                    />
                    <Button type="submit" variant="contained"
                        disabled={loading || !query} sx={{ minWidth: 120 }}>
                        {loading ? <CircularProgress size={22} color="inherit" /> : 'Consultar'}
                    </Button>
                </Box>

                {/* Results */}
                {results && (
                    <Box>
                        <Divider sx={{ mb: 2 }} />
                        {results.type === 'empty' && (
                            <Alert severity="warning" variant="outlined">{results.message}</Alert>
                        )}
                        {results.type === 'single' && (
                            <PrinterCard printer={results.data} onNavigate={router.push} statusColor={statusColor} />
                        )}
                        {results.type === 'list' && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Typography variant="subtitle2" color="primary">
                                    {results.data.length} equipo(s) asociado(s) al RIF {query}
                                </Typography>
                                {results.data.map(p => (
                                    <PrinterCard key={p.serial} printer={p} onNavigate={router.push} statusColor={statusColor} />
                                ))}
                            </Box>
                        )}
                    </Box>
                )}

                <Alert severity="info" variant="outlined" sx={{ mt: results ? 0 : 1 }}>
                    Toda consulta queda registrada en la bitácora de auditoría del sistema.
                </Alert>
            </Paper>
        </Box>
    )
}

function PrinterCard({ printer, onNavigate, statusColor }: {
    printer: Printer
    onNavigate: (path: string) => void
    statusColor: (s: string) => any
}) {
    return (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <ListItem
                sx={{ px: 2.5, py: 1.5, '&:hover': { bgcolor: 'action.hover' } }}
                secondaryAction={
                    <Button size="small" variant="outlined"
                        onClick={() => onNavigate(`/servicios-fiscales/${printer.serial}`)}>
                        Ver Registros
                    </Button>
                }
            >
                <ListItemText
                    primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight="bold">{printer.serial}</Typography>
                            <Chip label={printer.model} size="small" variant="outlined" />
                            <Chip label={printer.status} size="small" color={statusColor(printer.status)} sx={{ height: 18, fontSize: '0.65rem' }} />
                        </Box>
                    }
                    secondary={`${printer.company}  •  RIF: ${printer.rif}`}
                />
            </ListItem>
        </Paper>
    )
}
