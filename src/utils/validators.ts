export const isValidRif = (rif: string): boolean => {
    const rifRegex = /^[VEJPG][0-9]{7,9}$/i;
    return rifRegex.test(rif);
};

export const RIF_VALIDATION_ERROR_MSG = 'Formato de RIF inválido. Debe ser: V/E/J/P/G seguido de 7 a 9 números.';

// Use this in Antd Form `rules`
export const getRifRule = () => ({
    validator: async (_: any, value: string) => {
        if (!value) return Promise.resolve();
        if (!isValidRif(value)) {
            return Promise.reject(new Error(RIF_VALIDATION_ERROR_MSG));
        }
        return Promise.resolve();
    }
});
