import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    } catch (error) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      };
      
      if (data) {
        headers['Content-Type'] = 'application/json';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
        mode: "cors",
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);
      await throwIfResNotOk(res);
      return res;
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof DOMException || 
          error instanceof TypeError ||
          (error as Error).name === 'AbortError' ||
          (error as Error).message.includes('fetch')) {
        
        console.warn(`Network attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter
          const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 1000, 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error("Connection failed after multiple attempts - please refresh the page");
      }
      
      throw error;
    }
  }

  throw lastError || new Error("Unknown network error");
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      if (error instanceof DOMException) {
        throw new Error("Network connection failed");
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000, // 30 seconds for better real-time updates
      retry: (failureCount, error) => {
        // Enhanced retry logic for DOMException errors
        if (error instanceof Error) {
          if (error.message.includes("Network connection failed") || 
              error.message.includes("fetch") ||
              error.name === "DOMException") {
            return failureCount < 3;
          }
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    },
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          if (error.message.includes("Network connection failed") ||
              error.message.includes("fetch") ||
              error.name === "DOMException") {
            return failureCount < 2;
          }
        }
        return false;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    },
  },
});
