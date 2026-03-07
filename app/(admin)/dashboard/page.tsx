'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import PrintIcon from '@mui/icons-material/Print'
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import { alpha } from '@mui/material/styles'

const stats = [
    { label: 'Impresoras', value: '—', icon: <PrintIcon />, color: '#2196F3' },
    { label: 'Clientes', value: '—', icon: <PeopleOutlineIcon />, color: '#4CAF50' },
    { label: 'Empresas', value: '—', icon: <BusinessOutlinedIcon />, color: '#FF9800' },
    { label: 'Reportes', value: '—', icon: <AssessmentOutlinedIcon />, color: '#9C27B0' },
]

export default function DashboardPage() {
    return (
        <Box>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
                Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Bienvenido al sistema de administración AEG.
            </Typography>

            <Grid container spacing={3}>
                {stats.map((stat) => (
                    <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: stat.color,
                                }}
                            >
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    {stat.value}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {stat.label}
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>
        </Box>
    )
}
