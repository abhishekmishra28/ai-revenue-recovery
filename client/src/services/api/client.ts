const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4000";

type ApiResponse<T> = {
  data: T;
};

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const result =
      (await response.json()) as ApiResponse<T>;

    return result.data;
  },

  async post<T>(
    path: string,
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(
      `${API_BASE_URL}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body
          ? JSON.stringify(body)
          : undefined,
      },
    );

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const result =
      (await response.json()) as ApiResponse<T>;

    return result.data;
  },
};