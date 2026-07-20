package com.appsmith.server.dtos;

/**
 * Optional body for POST /api/v1/users/mcp-tokens. Carries the user-chosen token name; the whole body (or the name)
 * may be absent, in which case the service defaults the name to "Token created &lt;date&gt;".
 */
public record McpTokenCreateRequestDTO(String name) {}
