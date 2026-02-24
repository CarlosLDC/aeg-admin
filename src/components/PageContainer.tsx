import React from 'react';
import PageHeader, { type PageHeaderProps } from './PageHeader';

interface PageContainerProps extends PageHeaderProps {
    children: React.ReactNode;
}

/**
 * Wrapper general para las páginas de la aplicación.
 * Incluye la animación de fade-in y la cabecera estandarizada.
 */
const PageContainer: React.FC<PageContainerProps> = ({ children, ...headerProps }) => {
    return (
        <div className="fade-in">
            <PageHeader {...headerProps} />
            {children}
        </div>
    );
};

export default PageContainer;
