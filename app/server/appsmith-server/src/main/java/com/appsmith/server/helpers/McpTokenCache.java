package com.appsmith.server.helpers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;

/**
 * Auth cache for the live MCP token of a key. One Redis entry per {@code mcpKeyId}; rotate overwrites, revoke
 * deletes. Redis outages fail open (auth falls back to Mongo).
 */
@Slf4j
@Component
public class McpTokenCache {

    static final String KEY_PREFIX = "mcp_token:";

    private final ReactiveRedisOperations<String, String> redisOperations;
    private final ObjectMapper objectMapper;

    public McpTokenCache(ReactiveRedisOperations<String, String> redisOperations, ObjectMapper objectMapper) {
        this.redisOperations = redisOperations;
        this.objectMapper = objectMapper;
    }

    public Mono<Entry> get(String mcpKeyId) {
        return redisOperations
                .opsForValue()
                .get(redisKey(mcpKeyId))
                .flatMap(this::readEntry)
                .onErrorResume(error -> {
                    log.debug("MCP token cache get failed for key {}", mcpKeyId, error);
                    return Mono.empty();
                });
    }

    public Mono<Void> put(String mcpKeyId, Entry entry) {
        Duration ttl = ttlUntil(entry.expiresAt());
        if (ttl == null) {
            return Mono.empty();
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(entry);
        } catch (JsonProcessingException exception) {
            log.debug("MCP token cache put skipped; could not serialize entry for key {}", mcpKeyId, exception);
            return Mono.empty();
        }

        return redisOperations
                .opsForValue()
                .set(redisKey(mcpKeyId), payload, ttl)
                .then()
                .onErrorResume(error -> {
                    log.debug("MCP token cache put failed for key {}", mcpKeyId, error);
                    return Mono.empty();
                });
    }

    public Mono<Void> evict(String mcpKeyId) {
        return redisOperations.opsForValue().delete(redisKey(mcpKeyId)).then().onErrorResume(error -> {
            log.debug("MCP token cache evict failed for key {}", mcpKeyId, error);
            return Mono.empty();
        });
    }

    private Mono<Entry> readEntry(String payload) {
        try {
            return Mono.just(objectMapper.readValue(payload, Entry.class));
        } catch (JsonProcessingException exception) {
            return Mono.empty();
        }
    }

    static String redisKey(String mcpKeyId) {
        return KEY_PREFIX + mcpKeyId;
    }

    private static Duration ttlUntil(Instant expiresAt) {
        if (expiresAt == null) {
            return null;
        }
        Duration ttl = Duration.between(Instant.now(), expiresAt);
        if (ttl.isZero() || ttl.isNegative()) {
            return null;
        }
        return ttl;
    }

    public record Entry(String userId, String tokenHash, Instant expiresAt) {}
}
