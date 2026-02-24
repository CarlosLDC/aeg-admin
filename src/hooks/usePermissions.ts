import { useAuth } from '../contexts/AuthContext';

export const usePermissions = () => {
    const { profile } = useAuth();
    
    // Viewer role shouldn't be able to edit, delete, or create
    const isViewer = profile?.rol === 'viewer';
    
    return {
        create: !isViewer,
        update: !isViewer,
        delete: !isViewer,
    };
};
