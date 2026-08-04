package com.appsmith.server.services.ce;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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

    /**
     * The only modes that may be looked up or cached.
     *
     * <p>{@code mode} reaches this service straight from the client via {@code AIEditorContextDTO.getMode()}, and it
     * used to be both the cache key and part of a classpath resource path. The cache is an unbounded
     * {@code ConcurrentHashMap} with no eviction, so an authenticated caller looping over random modes grew the heap
     * without bound; and building a resource path out of caller-supplied text is unvalidated path construction even
     * though {@code cleanPath} plus the {@code -reference.md} suffix made traversal impractical. An allowlist closes
     * both at once, and it costs nothing: these are exactly the modes that have a bundled reference.
     */
    private static final Set<String> SUPPORTED_MODES = Set.of("javascript", "sql", "graphql");

    public AIReferenceServiceCEImpl() {}

    @PostConstruct
    void warmCache() {
        for (String mode : SUPPORTED_MODES) {
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

        // Locale.ROOT so a Turkish-locale server does not fold "I" to a dotless i and miss the allowlist.
        String normalizedMode = mode.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED_MODES.contains(normalizedMode)) {
            // Unknown mode: no cache entry, no resource lookup. The system prompt simply carries no
            // language-specific reference, which is the same outcome as a mode with no bundled file.
            return "";
        }
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
