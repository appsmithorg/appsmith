import Api from "api/Api";
import type { ApiResponse } from "api/ApiResponses";

export interface McpTokenMetadata {
  // The server serializes Instant fields as epoch seconds (a number); older/other paths may send an ISO string.
  createdAt: string | number;
  expiresAt: string | number;
  id: string;
}

export interface CreatedMcpToken extends McpTokenMetadata {
  token: string;
}

class McpTokenApi extends Api {
  static url = "v1/users/mcp-tokens";

  static async create(): Promise<ApiResponse<CreatedMcpToken>> {
    const response = await Api.post(McpTokenApi.url);

    return response as unknown as ApiResponse<CreatedMcpToken>;
  }

  static async list(): Promise<ApiResponse<McpTokenMetadata>[]> {
    const response = await Api.get(McpTokenApi.url);

    return (
      Array.isArray(response) ? response : [response]
    ) as ApiResponse<McpTokenMetadata>[];
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
