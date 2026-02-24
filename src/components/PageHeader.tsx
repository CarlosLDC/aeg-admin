import React from 'react';
import { Typography, Space } from 'antd';

const { Title } = Typography;

export interface PageHeaderProps {
    title: string;
    extra?: React.ReactNode;
}

/**
 * Componente estandarizado para la cabecera de las páginas.
 * Asegura que todos los títulos tengan la misma altura y espaciado.
 */
const PageHeader: React.FC<PageHeaderProps> = ({ title, extra }) => {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px',
            minHeight: '40px' // Altura mínima consistente
        }}>
            <Title level={2} style={{ margin: 0, minWidth: '200px' }}>
                {title}
            </Title>
            {extra && (
                <Space wrap>
                    {extra}
                </Space>
            )}
        </div>
    );
};

export default PageHeader;
