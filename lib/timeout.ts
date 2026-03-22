/**
 * Wraps a promise with a timeout.
 * If the promise doesn't resolve within the specified ms, it rejects.
 */
export async function withTimeout<T>(
  promise: Promise<T> | PromiseLike<T>,
  timeoutMs: number = 15000,
  errorMessage: string = 'La conexión es lenta o se ha perdido. Reintente en unos momentos.'
): Promise<T> {
  let timeoutId: any;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    // We wrap the input in Promise.resolve to handle PromiseLike correctly
    const result = await Promise.race([Promise.resolve(promise), timeoutPromise]);
    return result as T;
  } finally {
    clearTimeout(timeoutId);
  }
}
