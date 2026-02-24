import { Layout, Avatar, Dropdown, Space, Typography, Grid } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined, BgColorsOutlined, DesktopOutlined, BulbOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

interface HeaderProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const AppHeader = ({ collapsed, onCollapse }: HeaderProps) => {
    const { theme, setTheme } = useTheme();
    const { signOut, user, profile } = useAuth();
    const screens = Grid.useBreakpoint();
    const navigate = useNavigate();

    const userMenu = {
        items: [
            {
                key: '1',
                icon: <SettingOutlined />,
                label: 'Configuración',
                onClick: () => navigate('/perfil')
            },
            {
                key: '2',
                icon: <LogoutOutlined />,
                label: 'Cerrar Sesión',
                danger: true,
                onClick: async () => {
                    await signOut();
                }
            },
        ],
    };

    const themeMenu: MenuProps = {
        items: [
            {
                key: 'light',
                icon: <BulbOutlined />,
                label: 'Modo Claro',
                onClick: () => setTheme('light'),
            },
            {
                key: 'dark',
                icon: <BgColorsOutlined />,
                label: 'Modo Oscuro',
                onClick: () => setTheme('dark'),
            },
            {
                key: 'system',
                icon: <DesktopOutlined />,
                label: 'Tema del Sistema',
                onClick: () => setTheme('system'),
            }
        ],
        selectedKeys: [theme]
    };

    return (
        <AntHeader style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            borderBottom: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
            lineHeight: '64px'
        }}>
            {!screens.lg && (
                <div
                    onClick={() => onCollapse(!collapsed)}
                    style={{ cursor: 'pointer', fontSize: '18px', marginRight: '16px', display: 'flex', alignItems: 'center' }}
                >
                    {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                </div>
            )}
            <div style={{ flex: 1 }} />
            <Space size={32} align="center">
                <Dropdown menu={themeMenu} trigger={['click']}>
                    <BgColorsOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
                </Dropdown>
                <BellOutlined style={{ fontSize: '18px', cursor: 'pointer' }} />
                <Dropdown menu={userMenu} trigger={['click']}>
                    <Space style={{ cursor: 'pointer' }}>
                        <Avatar src={profile?.foto_perfil} icon={!profile?.foto_perfil && <UserOutlined />} />
                        {screens.md && (
                            <Text strong style={{ color: 'inherit' }}>{profile?.nombre || user?.email || 'Usuario Administrador'}</Text>
                        )}
                    </Space>
                </Dropdown>
            </Space>
        </AntHeader>
    );
};

export default AppHeader;
