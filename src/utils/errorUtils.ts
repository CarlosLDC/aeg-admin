export class DomainError extends Error {
    type: 'DUPLICATE_RECORD' | 'FOREIGN_KEY_VIOLATION' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR' | 'PERMISSION_ERROR';

    constructor(message: string, type: 'DUPLICATE_RECORD' | 'FOREIGN_KEY_VIOLATION' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR' | 'PERMISSION_ERROR') {
        super(message);
        this.name = 'DomainError';
        this.type = type;
    }
}

export const handleSupabaseError = (error: any, entityName: string = 'registro') => {
    const code = error?.code || error?.status;

    if (code === '23503') { // Foreign key constraint violation
        throw new DomainError(
            `No se puede eliminar porque este ${entityName} tiene datos asociados.`,
            'FOREIGN_KEY_VIOLATION'
        );
    }
    
    if (code === '23505') { // Unique violation
        throw new DomainError(
            `Ya existe un ${entityName} con esos datos únicos.`,
            'DUPLICATE_RECORD'
        );
    }

    if (code === '42501') { // Insufficient privilege
        throw new DomainError(
            `No tienes permisos para realizar esta acción en ${entityName}.`,
            'PERMISSION_ERROR'
        );
    }

    throw new DomainError(
        error?.message || `Error inesperado procesando ${entityName}.`,
        'UNKNOWN_ERROR'
    );
};
