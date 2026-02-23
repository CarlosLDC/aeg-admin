import { Layout, Menu, Typography, Grid, Drawer } from 'antd';
import { DashboardOutlined, BankOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const { Sider } = Layout;
const { Title, Text } = Typography;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const SidebarContent: React.FC<{ isDark: boolean; menuItems: any[]; currentPath: string; onNavigate: (key: string) => void }> = ({ isDark, menuItems, currentPath, onNavigate }) => {
  const titleColor = isDark ? '#ffffff' : '#181D1F';
  const subtitleColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(24,29,31,0.45)';
  const accentBarColor = '#2196F3';

  return (
    <>
      {/* Brand block */}
      <div style={{
        padding: '28px 20px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '8px'
      }}>
        {/* Blue accent bar */}
        <div style={{
          width: '4px',
          height: '36px',
          background: accentBarColor,
          borderRadius: '2px',
          flexShrink: 0
        }} />
        <div>
          <Title
            level={4}
            style={{ margin: 0, color: titleColor, fontFamily: 'Outfit', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            AEG Admin
          </Title>
          <Text style={{ color: subtitleColor, fontSize: '11px', fontFamily: 'Inter', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Máquinas Fiscales
          </Text>
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[currentPath]}
        items={menuItems}
        onClick={({ key }) => onNavigate(key)}
        style={{
          padding: '4px 12px',
          background: 'transparent',
          borderRight: 'none',
        }}
        theme={isDark ? 'dark' : 'light'}
      />
    </>
  );
};

const Sidebar = ({ collapsed, onCollapse }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const screens = Grid.useBreakpoint();

  // In light mode: clean white sidebar with dark text / blue accents
  // In dark mode: dark sidebar with white text


  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Panel de Control',
    },
    {
      key: '/empresas',
      icon: <BankOutlined />,
      label: 'Empresas',
    },
    {
      key: '/sucursales',
      icon: <ShopOutlined />,
      label: 'Sucursales',
    },
  ];


  const handleNavigate = (key: string) => {
    navigate(key);
    if (!screens.lg) {
      onCollapse(true);
    }
  };

  if (!screens.lg) {
    return (
      <Drawer
        placement="left"
        onClose={() => onCollapse(true)}
        open={!collapsed}
        styles={{ body: { padding: 0 } }}
        width={240}
        closeIcon={null}
      >
        <SidebarContent
          isDark={isDark}
          menuItems={menuItems}
          currentPath={location.pathname}
          onNavigate={handleNavigate}
        />
      </Drawer>
    );
  }

  return (
    <Sider
      width={240}
      className="app-sidebar"
      breakpoint="lg"
      collapsedWidth="0"
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={null}
      style={{ borderRight: '1px solid var(--border-color)' }}
    >
      <SidebarContent
        isDark={isDark}
        menuItems={menuItems}
        currentPath={location.pathname}
        onNavigate={handleNavigate}
      />
    </Sider>
  );
};

export default Sidebar;
