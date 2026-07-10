package com.appsmith.server.dtos;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record McpTokenResponseDTO(String id, String token, Instant createdAt) {}
