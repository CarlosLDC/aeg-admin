import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute: React.FC = () => {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!session) {
        // Not authenticated, redirect to login page
        return <Navigate to="/login" replace />;
    }

    // Authenticated, render child routes
    return <Outlet />;
};

export default ProtectedRoute;
