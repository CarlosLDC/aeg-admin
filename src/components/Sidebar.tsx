import { Layout, Menu, Grid, Drawer } from 'antd';
import { DashboardOutlined, BankOutlined, ShopOutlined, PrinterOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const SidebarContent: React.FC<{ isDark: boolean; menuItems: any[]; currentPath: string; onNavigate: (key: string) => void }> = ({ isDark, menuItems, currentPath, onNavigate }) => {
  return (
    <>
      {/* Brand block */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '8px'
      }}>
        <img
          src="/logo.png"
          alt="AEG Logo"
          style={{
            maxWidth: '100%',
            height: 'auto',
            maxHeight: '48px',
            objectFit: 'contain'
          }}
        />
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
    {
      key: '/modelos',
      icon: <PrinterOutlined />,
      label: 'Modelos',
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
