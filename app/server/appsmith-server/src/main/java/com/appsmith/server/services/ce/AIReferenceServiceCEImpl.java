package com.appsmith.server.services.ce;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class AIReferenceServiceCEImpl implements AIReferenceServiceCE {

    private final Map<String, String> contentCache = new ConcurrentHashMap<>();

    private static final Map<String, String> INLINE_FALLBACKS = Map.of(
            "javascript",
            "You are an expert JavaScript developer helping with Appsmith code. "
                    + "Appsmith uses bindings in {{}} syntax. Provide clean, efficient code.",
            "sql",
            "You are an expert SQL developer helping with database queries in Appsmith. "
                    + "Provide optimized, correct SQL queries.",
            "graphql",
            "You are an expert GraphQL developer helping with GraphQL queries in Appsmith. "
                    + "Provide correct, efficient GraphQL queries.");

    private static final String COMMON_ISSUES_KEY = "common-issues";
    private static final String BUNDLED_RESOURCE_PREFIX = "ai-references/";

    public AIReferenceServiceCEImpl() {}

    @PostConstruct
    void warmCache() {
        for (String mode : List.of("javascript", "sql", "graphql")) {
            getReferenceContent(mode);
        }
        getCommonIssuesContent();
        log.debug("AI reference cache warmed with {} entries", contentCache.size());
    }

    @Override
    public String getReferenceContent(String mode) {
        if (mode == null || mode.trim().isEmpty()) {
            return "";
        }

        String normalizedMode = mode.toLowerCase().trim();
        String cacheKey = "mode:" + normalizedMode;

        String cached = contentCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        String content = loadReference(normalizedMode);
        contentCache.put(cacheKey, content);
        return content;
    }

    @Override
    public String getCommonIssuesContent() {
        String cached = contentCache.get(COMMON_ISSUES_KEY);
        if (cached != null) {
            return cached;
        }

        String content = tryLoadBundledResource(BUNDLED_RESOURCE_PREFIX + "common-issues.md");
        if (content == null) {
            content = "";
        }
        contentCache.put(COMMON_ISSUES_KEY, content);
        return content;
    }

    private String loadReference(String mode) {
        String content = tryLoadBundledResource(BUNDLED_RESOURCE_PREFIX + mode + "-reference.md");
        if (content != null) {
            log.debug("Loaded AI reference from bundled resource for mode: {}", mode);
            return content;
        }

        String fallback = INLINE_FALLBACKS.getOrDefault(mode, "");
        if (!fallback.isEmpty()) {
            log.debug("Using inline fallback for mode: {}", mode);
        } else {
            log.warn("No AI reference content found for mode: {}", mode);
        }
        return fallback;
    }

    private String tryLoadBundledResource(String resourcePath) {
        try {
            ClassPathResource resource = new ClassPathResource(resourcePath);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    return new String(is.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        } catch (IOException e) {
            log.warn("Failed to read bundled AI reference {}: {}", resourcePath, e.getMessage());
        }
        return null;
    }
}
