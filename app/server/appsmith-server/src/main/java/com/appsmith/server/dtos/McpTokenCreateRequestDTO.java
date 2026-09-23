package com.appsmith.server.dtos;

/**
 * Body for POST /api/v1/users/mcp-tokens. {@code name} is optional (defaulted server-side). {@code keySpanDays}
 * must be one of 30, 60, 90, 180, 365.
 */
public record McpTokenCreateRequestDTO(String name, Integer keySpanDays) {

    public McpTokenCreateRequestDTO(String name) {
        this(name, null);
    }
}
