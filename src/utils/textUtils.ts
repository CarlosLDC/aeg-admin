/**
 * Normaliza un texto convirtiéndolo a mayúsculas y eliminando tildes/acentos.
 */
export const normalizeText = (value: string | undefined): string => {
    if (!value) return '';
    
    return value
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};
