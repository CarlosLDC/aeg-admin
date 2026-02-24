import { Layout, Avatar, Dropdown, Space, Typography, Grid, Button, Tooltip } from 'antd';

import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined, DesktopOutlined, BulbOutlined, MenuUnfoldOutlined, MenuFoldOutlined, MoonOutlined } from '@ant-design/icons';
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

    const cycleTheme = () => {
        if (theme === 'system') setTheme('light');
        else if (theme === 'light') setTheme('dark');
        else setTheme('system');
    };

    const getThemeIcon = () => {
        const iconProps = { style: { fontSize: '18px' } };
        let icon;
        let titleTxt;

        if (theme === 'system') {
            icon = <DesktopOutlined {...iconProps} />;
            titleTxt = "Tema del Sistema";
        } else if (theme === 'light') {
            icon = <BulbOutlined {...iconProps} />;
            titleTxt = "Modo Claro";
        } else {
            icon = <MoonOutlined {...iconProps} />;
            titleTxt = "Modo Oscuro";
        }

        return (
            <Tooltip title={titleTxt} placement="bottom">
                <Button
                    type="text"
                    shape="circle"
                    icon={icon}
                    onClick={cycleTheme}
                    size="large"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
            </Tooltip>
        );
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
                {getThemeIcon()}
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
