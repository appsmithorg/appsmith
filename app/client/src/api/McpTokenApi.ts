import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";

export type McpKeyStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export interface McpTokenMetadata {
  // The server serializes Instant fields as epoch seconds (a number); older/other paths may send an ISO string.
  createdAt: string | number;
  expiresAt: string | number;
  id: string;
  // User-facing label. Absent on tokens created before naming existed; the UI falls back to the id then.
  name?: string;
  // Derived on the server. List currently omits revoked keys, so REVOKED will not appear until that query changes.
  status?: McpKeyStatus;
}

export interface CreatedMcpToken extends McpTokenMetadata {
  token: string;
}

class McpTokenApi extends Api {
  static url = "v1/users/mcp-tokens";

  // name is optional; a blank/absent name is defaulted server-side to "Token created <date>".
  // keySpanDays must be one of 30, 60, 90, 180, 365; the server defaults to 30 if omitted.
  static async create(
    name?: string,
    keySpanDays?: number,
  ): Promise<ApiResponse<CreatedMcpToken>> {
    const trimmed = name?.trim();
    const response = await Api.post(McpTokenApi.url, {
      ...(trimmed ? { name: trimmed } : {}),
      ...(keySpanDays != null ? { keySpanDays } : {}),
    });

    return response as unknown as ApiResponse<CreatedMcpToken>;
  }

  // One envelope whose `data` holds the whole list, matching every other list endpoint. (The server used to return
  // Flux<ResponseDTO<T>> — a bare array of N envelopes — which had no top-level responseMeta for the shared
  // response interceptor to validate.)
  static async list(): Promise<ApiResponse<McpTokenMetadata[]>> {
    const response = await Api.get(McpTokenApi.url);

    return response as unknown as ApiResponse<McpTokenMetadata[]>;
  }

  static async rotate(tokenId: string): Promise<ApiResponse<CreatedMcpToken>> {
    const response = await Api.post(`${McpTokenApi.url}/${tokenId}/rotate`);

    return response as unknown as ApiResponse<CreatedMcpToken>;
  }

  static async revoke(tokenId: string): Promise<ApiResponse<boolean>> {
    const response = await Api.delete(`${McpTokenApi.url}/${tokenId}`);

    return response as unknown as ApiResponse<boolean>;
  }
}

export default McpTokenApi;
