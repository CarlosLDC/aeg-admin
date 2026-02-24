import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import EmpresasPage from './pages/EmpresasPage';
import SucursalesPage from './pages/SucursalesPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import ModelosPage from './pages/ModelosPage';
import ProtectedRoute from './components/ProtectedRoute';

import { ConfigProvider, theme } from 'antd';
import es_ES from 'antd/es/locale/es_ES';
import { useTheme } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const { isDark } = useTheme();
  return (
    <ConfigProvider
      locale={es_ES}
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2196F3',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        components: {
          Layout: {
            // These must be set explicitly — the algorithm alone doesn't
            // override Layout's internal bg tokens in Ant Design v5.
            headerBg: isDark ? '#1f1f1f' : '#ffffff',
            siderBg: isDark ? '#1f1f1f' : '#ffffff',
            bodyBg: isDark ? '#141414' : '#f5f5f5',
          },
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="empresas" element={<EmpresasPage />} />
                <Route path="sucursales" element={<SucursalesPage />} />
                <Route path="modelos" element={<ModelosPage />} />
                <Route path="perfil" element={<ProfilePage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
