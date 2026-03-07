'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import LogoutIcon from '@mui/icons-material/Logout'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PrintIcon from '@mui/icons-material/Print'
import DownloadIcon from '@mui/icons-material/Download'
import BuildIcon from '@mui/icons-material/Build'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import { createClient } from '@/lib/supabase/client'
import {
    PRINTERS, TECHNICAL_SERVICES, ANNUAL_INSPECTIONS,
    type TechnicalService, type AnnualInspection
} from '@/lib/servicios-fiscales/mock-data'

export default function ServiciosFiscalesDetailPage() {
    const params = useParams()
    const router = useRouter()
    const serial = params?.serial as string
    const [tabValue, setTabValue] = React.useState(0)
    const [userEmail, setUserEmail] = React.useState<string | null>(null)
    const [downloading, setDownloading] = React.useState<string | null>(null)
    const [downloadError, setDownloadError] = React.useState<string | null>(null)

    React.useEffect(() => {
        createClient().auth.getUser().then(({ data: { user } }) => {
            if (user) setUserEmail(user.email ?? null)
        })
    }, [])

    const printer = PRINTERS[serial]
    const services = TECHNICAL_SERVICES[serial] ?? []
    const inspections = ANNUAL_INSPECTIONS[serial] ?? []

    if (!printer) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                <Alert severity="error" variant="outlined">
                    Equipo no encontrado. <Button size="small" onClick={() => router.push('/servicios-fiscales')}>Volver</Button>
                </Alert>
            </Box>
        )
    }

    const handleDownloadService = async (service: TechnicalService) => {
        setDownloadError(null)
        setDownloading(service.id)
        try {
            const { generateServicioTecnicoPDF } = await import('@/lib/servicios-fiscales/pdf-generator')
            await generateServicioTecnicoPDF(printer, service)
        } catch {
            setDownloadError('Error al generar el PDF. Por favor intente nuevamente.')
        } finally {
            setDownloading(null)
        }
    }

    const handleDownloadInspection = async (inspection: AnnualInspection) => {
        setDownloadError(null)
        setDownloading(inspection.id)
        try {
            const { generateInspeccionAnualPDF } = await import('@/lib/servicios-fiscales/pdf-generator')
            await generateInspeccionAnualPDF(printer, inspection)
        } catch {
            setDownloadError('Error al generar el PDF. Por favor intente nuevamente.')
        } finally {
            setDownloading(null)
        }
    }

    const handleLogout = async () => {
        await createClient().auth.signOut()
        router.push('/login')
        router.refresh()
    }

    const statusColor = (s: string) => ({
        'Completado': 'info' as const,
        'En Proceso': 'warning' as const,
        'Pendiente': 'default' as const,
        'Aprobado': 'success' as const,
        'Observaciones': 'warning' as const,
        'Rechazado': 'error' as const,
    }[s] ?? 'default')

    const printerStatusColor = printer.status === 'Activo' ? 'success' as const : printer.status === 'En Mantenimiento' ? 'warning' as const : 'default' as const

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'flex-start',
            bgcolor: '#f5f5f5', p: 2, pt: 10, position: 'relative'
        }}>
            {/* Top actions */}
            <Box sx={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 1 }}>
                {userEmail && (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1, fontWeight: 500 }}>
                        {userEmail}
                    </Typography>
                )}
                <IconButton onClick={handleLogout} size="small" title="Cerrar sesión">
                    <LogoutIcon fontSize="small" />
                </IconButton>
            </Box>

            <Paper elevation={2} sx={{
                width: '100%', maxWidth: 700, p: 4, borderRadius: 3,
                display: 'flex', flexDirection: 'column', gap: 3, mb: 4
            }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ bgcolor: 'primary.main', p: 1, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PrintIcon sx={{ color: 'white', fontSize: 30 }} />
                        </Box>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h5" fontWeight="bold">{printer.serial}</Typography>
                                <Chip label={printer.model} size="small" variant="outlined" />
                                <Chip label={printer.status} size="small" color={printerStatusColor} sx={{ height: 20, fontSize: '0.65rem' }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {printer.company} • RIF: {printer.rif}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {printer.address}
                            </Typography>
                        </Box>
                    </Box>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/servicios-fiscales')}
                        size="small" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                        Volver
                    </Button>
                </Box>

                <Divider />

                {/* Tabs */}
                <Box>
                    <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}
                        variant="fullWidth" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Tab
                            label={`Servicios Técnicos (${services.length})`}
                            icon={<BuildIcon fontSize="small" />}
                            iconPosition="start"
                        />
                        <Tab
                            label={`Inspecciones Anuales (${inspections.length})`}
                            icon={<VerifiedUserIcon fontSize="small" />}
                            iconPosition="start"
                        />
                    </Tabs>

                    {/* Technical Services Tab */}
                    {tabValue === 0 && (
                        <List sx={{ pt: 0 }}>
                            {services.length === 0 && (
                                <Alert severity="info" variant="outlined">No hay servicios técnicos registrados.</Alert>
                            )}
                            {services.map((svc) => (
                                <ListItem
                                    key={svc.id}
                                    divider
                                    alignItems="flex-start"
                                    sx={{ px: 2, py: 1.5, transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography fontWeight="bold" variant="body1">{svc.type}</Typography>
                                                <Chip label={svc.status} size="small" color={statusColor(svc.status)} variant="outlined" />
                                            </Box>
                                        }
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                                <Typography variant="caption" component="span"><strong>ID:</strong> {svc.id}</Typography>
                                                <Typography variant="caption" component="span"><strong>Fecha:</strong> {svc.date} &nbsp;|&nbsp; <strong>Técnico:</strong> {svc.technician} &nbsp;|&nbsp; <strong>Duración:</strong> {svc.duration}</Typography>
                                                <Typography variant="caption" component="span" color="text.secondary" sx={{ fontStyle: 'italic' }}>{svc.observations.length > 100 ? svc.observations.slice(0, 100) + '…' : svc.observations}</Typography>
                                                {svc.nextService && (
                                                    <Typography variant="caption" component="span" color="primary">Próximo servicio: {svc.nextService}</Typography>
                                                )}
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
                                                        : <DownloadIcon fontSize="small" />
                                                    }
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}

                    {/* Annual Inspections Tab */}
                    {tabValue === 1 && (
                        <List sx={{ pt: 0 }}>
                            {inspections.length === 0 && (
                                <Alert severity="info" variant="outlined">No hay inspecciones registradas.</Alert>
                            )}
                            {inspections.map((ins) => (
                                <ListItem
                                    key={ins.id}
                                    divider
                                    alignItems="flex-start"
                                    sx={{ px: 2, py: 1.5, transition: 'background 0.2s', '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <Typography fontWeight="bold" variant="body1">Inspección Anual {ins.year}</Typography>
                                                <Chip label={ins.status} size="small" color={statusColor(ins.status)} variant="outlined" />
                                            </Box>
                                        }
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                                                <Typography variant="caption" component="span"><strong>Resolución:</strong> {ins.resolutionNumber}</Typography>
                                                <Typography variant="caption" component="span"><strong>Fecha:</strong> {ins.date} &nbsp;|&nbsp; <strong>Inspector:</strong> {ins.inspector}</Typography>
                                                <Typography variant="caption" component="span"><strong>Delegación:</strong> {ins.delegation}</Typography>
                                                <Typography variant="caption" component="span" color="text.secondary" sx={{ fontStyle: 'italic' }}>{ins.observations.length > 100 ? ins.observations.slice(0, 100) + '…' : ins.observations}</Typography>
                                                <Typography variant="caption" component="span" color="primary">Próxima inspección: {ins.nextInspection}</Typography>
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
                                                        : <DownloadIcon fontSize="small" />
                                                    }
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

                {downloadError && (
                    <Alert severity="error" variant="outlined" onClose={() => setDownloadError(null)}>
                        {downloadError}
                    </Alert>
                )}

                <Typography variant="caption" color="text.secondary" align="center" sx={{ display: 'block' }}>
                    AEG Admin • Módulo de Servicios Fiscales {new Date().getFullYear()}
                </Typography>
            </Paper>
        </Box>
    )
}
