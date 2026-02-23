import { Layout, Grid } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AppHeader from '../components/Header';
import React, { useState, useEffect } from 'react';

const { Content, Footer } = Layout;

const MainLayout: React.FC = () => {
    const screens = Grid.useBreakpoint();

    // Inicializar basado en el ancho real para evitar animaciones indeseadas al cargar o redimensionar
    const [collapsed, setCollapsed] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 992 : true
    );

    // Sincronizar estado al cambiar de breakpoint (escritorio -> móvil)
    useEffect(() => {
        if (screens.lg === false) {
            // En móvil, siempre empezamos cerrados (collapsed=true)
            setCollapsed(true);
        } else if (screens.lg === true) {
            // En escritorio, empezamos abiertos (collapsed=false)
            setCollapsed(false);
        }
    }, [screens.lg]);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
            <Layout>
                <AppHeader collapsed={collapsed} onCollapse={setCollapsed} />
                <Content style={{ margin: '24px', position: 'relative', overflowX: 'hidden' }}>
                    <Outlet />
                </Content>
                <Footer style={{ textAlign: 'center', padding: '24px 50px', background: 'transparent' }}>
                    AEG Admin ©{new Date().getFullYear()} Creado para el Control de Máquinas Fiscales
                </Footer>
            </Layout>
        </Layout>
    );
};

export default MainLayout;
