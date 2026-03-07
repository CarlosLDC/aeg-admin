'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import LogoutIcon from '@mui/icons-material/Logout'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { createClient } from '@/lib/supabase/client'
import PrintIcon from '@mui/icons-material/Print'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import DownloadIcon from '@mui/icons-material/Download'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import BuildIcon from '@mui/icons-material/Build'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { PRINTERS, TECHNICAL_SERVICES, ANNUAL_INSPECTIONS, type TechnicalService, type AnnualInspection } from '@/lib/servicios-fiscales/mock-data'

export default function FiscalBookDetailPage() {
    const params = useParams()
    const router = useRouter()
    const serial = params?.serial as string
    const [tabValue, setTabValue] = React.useState(0)
    const [userEmail, setUserEmail] = React.useState<string | null>(null)
    const [downloading, setDownloading] = React.useState<string | null>(null)
    const [downloadError, setDownloadError] = React.useState<string | null>(null)

    React.useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserEmail(user.email ?? null)
        }
        fetchUser()
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    // Get data from shared mock data layer
    const printer = PRINTERS[serial] ?? {
        serial,
        model: serial === 'AEG0001' ? 'AEG-P80' : 'AEG-T200',
        status: 'Activo' as const,
        company: 'Inversiones C&A, C.A.',
        rif: 'J123456780',
        address: 'Caracas',
        phone: 'N/A',
        installDate: '2022-01-01',
    }

    const technicalServices = TECHNICAL_SERVICES[serial] ?? []
    const annualInspections = ANNUAL_INSPECTIONS[serial] ?? []

    const handleDownloadService = async (svc: TechnicalService) => {
        setDownloadError(null)
        setDownloading(svc.id)
        try {
            const { generateServicioTecnicoPDF } = await import('@/lib/servicios-fiscales/pdf-generator')
            await generateServicioTecnicoPDF(printer, svc)
        } catch (e) {
            console.error(e)
            setDownloadError('Error al generar el PDF. Por favor intente nuevamente.')
        } finally {
            setDownloading(null)
        }
    }

    const handleDownloadInspection = async (ins: AnnualInspection) => {
        setDownloadError(null)
        setDownloading(ins.id)
        try {
            const { generateInspeccionAnualPDF } = await import('@/lib/servicios-fiscales/pdf-generator')
            await generateInspeccionAnualPDF(printer, ins)
        } catch (e) {
            console.error(e)
            setDownloadError('Error al generar el PDF. Por favor intente nuevamente.')
        } finally {
            setDownloading(null)
        }
    }

    const statusColor = (s: string) => ({
        'Completado': 'info' as const,
        'En Proceso': 'warning' as const,
        'Pendiente': 'default' as const,
        'Aprobado': 'success' as const,
        'Observaciones': 'warning' as const,
        'Rechazado': 'error' as const,
    }[s] ?? 'default')

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                p: 2,
                pt: 8,
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
                    maxWidth: 680,
                    p: 4,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3
                }}
            >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PrintIcon sx={{ color: 'white', fontSize: 32 }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h5" fontWeight="bold">
                                    Libro Fiscal: {printer.serial}
                                </Typography>
                                <Chip label={printer.model} size="small" variant="outlined" />
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {printer.company}
                                </Typography>
                                <Chip
                                    label={printer.status}
                                    size="small"
                                    color={printer.status === 'Activo' ? 'success' : 'warning'}
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                />
                            </Box>
                        </Box>
                    </Box>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => router.push('/libros-fiscales')}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                    >
                        Volver
                    </Button>
                </Box>

                <Divider />

                {/* Content Tabs */}
                <Box>
                    <Tabs
                        value={tabValue}
                        onChange={(_, val) => setTabValue(val)}
                        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
                        variant="fullWidth"
                    >
                        <Tab
                            label={`Servicios Técnicos (${technicalServices.length})`}
                            icon={<BuildIcon fontSize="small" />}
                            iconPosition="start"
                        />
                        <Tab
                            label={`Inspecciones Anuales (${annualInspections.length})`}
                            icon={<VerifiedUserIcon fontSize="small" />}
                            iconPosition="start"
                        />
                    </Tabs>

                    <List sx={{ pt: 0 }}>
                        {/* Technical Services */}
                        {tabValue === 0 && technicalServices.map((svc) => (
                            <ListItem
                                key={svc.id}
                                divider
                                alignItems="flex-start"
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    transition: 'background 0.2s',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography fontWeight="bold">{svc.type}</Typography>
                                            <Chip label={svc.status} size="small" color={statusColor(svc.status)} variant="outlined" />
                                        </Box>
                                    }
                                    secondary={
                                        <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                            <Typography variant="caption" component="span">
                                                <strong>Fecha:</strong> {svc.date} &nbsp;|&nbsp; <strong>Técnico:</strong> {svc.technician} &nbsp;|&nbsp; <strong>Duración:</strong> {svc.duration}
                                            </Typography>
                                            <Typography variant="caption" component="span" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                {svc.observations.length > 90 ? svc.observations.slice(0, 90) + '…' : svc.observations}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, flexShrink: 0 }}>
                                    <Tooltip title="Descargar Comprobante PDF">
                                        <span>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                disabled={!!downloading}
                                                onClick={() => handleDownloadService(svc)}
                                            >
                                                {downloading === svc.id
                                                    ? <CircularProgress size={16} />
                                                    : <DownloadIcon fontSize="small" />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </ListItem>
                        ))}

                        {/* Annual Inspections */}
                        {tabValue === 1 && annualInspections.map((ins) => (
                            <ListItem
                                key={ins.id}
                                divider
                                alignItems="flex-start"
                                sx={{
                                    px: 2,
                                    py: 1.5,
                                    transition: 'background 0.2s',
                                    '&:hover': { bgcolor: 'action.hover' }
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                            <Typography fontWeight="bold">Inspección Anual {ins.year}</Typography>
                                            <Chip label={ins.status} size="small" color={statusColor(ins.status)} variant="outlined" />
                                        </Box>
                                    }
                                    secondary={
                                        <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                            <Typography variant="caption" component="span">
                                                <strong>Resolución:</strong> {ins.resolutionNumber}
                                            </Typography>
                                            <Typography variant="caption" component="span">
                                                <strong>Fecha:</strong> {ins.date} &nbsp;|&nbsp; <strong>Inspector:</strong> {ins.inspector}
                                            </Typography>
                                            <Typography variant="caption" component="span">
                                                <strong>Delegación:</strong> {ins.delegation}
                                            </Typography>
                                        </Box>
                                    }
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, flexShrink: 0 }}>
                                    <Tooltip title="Descargar Acta de Inspección PDF">
                                        <span>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                disabled={!!downloading}
                                                onClick={() => handleDownloadInspection(ins)}
                                            >
                                                {downloading === ins.id
                                                    ? <CircularProgress size={16} />
                                                    : <DownloadIcon fontSize="small" />}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {downloadError && (
                    <Alert severity="error" variant="outlined" onClose={() => setDownloadError(null)}>
                        {downloadError}
                    </Alert>
                )}

                {downloading && (
                    <Alert severity="success" variant="outlined">
                        Generando documento oficial para su descarga segura...
                    </Alert>
                )}

                <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                    AEG Admin • Versión de Auditoría {new Date().getFullYear()}
                </Typography>
            </Paper>
        </Box>
    )
}
