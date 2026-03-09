import { mockPrinters, FiscalPrinter } from './mock-data';

/**
 * Service to handle printer data fetching.
 * Currently it uses mock data, but is ready to be swapped for an API call or database query.
 */
export const printerService = {
  /**
   * Fetches a printer by its ID.
   * Can be easily changed to use fetch() or a database client.
   */
  getPrinterById: async (id: string): Promise<FiscalPrinter | undefined> => {
    // Artificial delay to simulate network/DB latency
    // await new Promise(resolve => setTimeout(resolve, 500));
    
    return mockPrinters.find((p) => p.id === id);
  },

  /**
   * Searches printers based on a query.
   */
  searchPrinters: async (query: string): Promise<FiscalPrinter[]> => {
    if (!query) return [];
    
    const normalizedQuery = query.toLowerCase();
    return mockPrinters.filter(
      (p) =>
        p.serial.toLowerCase().includes(normalizedQuery) ||
        p.rif.toLowerCase().includes(normalizedQuery) ||
        p.businessName.toLowerCase().includes(normalizedQuery)
    );
  }
};
