package com.appsmith.server.services.ce;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementation of AIReferenceServiceCE that loads reference documentation
 * with a fallback chain: external file -> bundled resource -> inline fallback.
 */
@Slf4j
public class AIReferenceServiceCEImpl implements AIReferenceServiceCE {

    @Value("${appsmith.ai.references.path:/appsmith/config/ai-references}")
    private String externalReferencesPath;

    // Simple in-memory cache to avoid repeated file I/O
    private final Map<String, String> contentCache = new ConcurrentHashMap<>();

    // Inline fallback prompts for when no files are found
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

    public AIReferenceServiceCEImpl() {
        // Default constructor
    }

    @Override
    public String getReferenceContent(String mode) {
        if (mode == null || mode.trim().isEmpty()) {
            return "";
        }

        String normalizedMode = mode.toLowerCase().trim();

        // Check cache first
        String cacheKey = "mode:" + normalizedMode;
        String cachedContent = contentCache.get(cacheKey);
        if (cachedContent != null) {
            return cachedContent;
        }

        // Try to load content with fallback chain
        String content = loadReferenceWithFallback(normalizedMode);

        // Cache the result (even empty strings to avoid repeated lookups)
        contentCache.put(cacheKey, content);

        return content;
    }

    @Override
    public String getCommonIssuesContent() {
        // Check cache first
        String cachedContent = contentCache.get(COMMON_ISSUES_KEY);
        if (cachedContent != null) {
            return cachedContent;
        }

        // Try to load common issues content
        String content = loadCommonIssuesWithFallback();

        // Cache the result
        contentCache.put(COMMON_ISSUES_KEY, content);

        return content;
    }

    /**
     * Load reference content with fallback chain:
     * 1. External file
     * 2. Bundled resource
     * 3. Inline fallback
     */
    private String loadReferenceWithFallback(String mode) {
        String filename = mode + "-reference.md";

        // Try external file first
        String content = tryLoadExternalFile(filename);
        if (content != null) {
            log.debug("Loaded AI reference from external file: {}", filename);
            return content;
        }

        // Try bundled resource
        content = tryLoadBundledResource("ai-references/" + filename);
        if (content != null) {
            log.debug("Loaded AI reference from bundled resource: {}", filename);
            return content;
        }

        // Fall back to inline content
        String fallback = INLINE_FALLBACKS.getOrDefault(mode, "");
        if (!fallback.isEmpty()) {
            log.debug("Using inline fallback for mode: {}", mode);
        } else {
            log.warn("No AI reference content found for mode: {}. Using empty string.", mode);
        }
        return fallback;
    }

    /**
     * Load common issues content with fallback chain.
     * Unlike mode references, common issues has no inline fallback.
     */
    private String loadCommonIssuesWithFallback() {
        String filename = "common-issues.md";

        // Try external file first
        String content = tryLoadExternalFile(filename);
        if (content != null) {
            log.debug("Loaded common issues from external file");
            return content;
        }

        // Try bundled resource
        content = tryLoadBundledResource("ai-references/" + filename);
        if (content != null) {
            log.debug("Loaded common issues from bundled resource");
            return content;
        }

        // No inline fallback for common issues - return empty string
        log.debug("No common issues file found, using empty string");
        return "";
    }

    /**
     * Try to load content from an external file path.
     *
     * @param filename The filename to load
     * @return File content or null if not found/readable
     */
    private String tryLoadExternalFile(String filename) {
        try {
            Path filePath = Paths.get(externalReferencesPath, filename);
            if (Files.exists(filePath) && Files.isReadable(filePath)) {
                return Files.readString(filePath, StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            log.warn("Failed to read external AI reference file {}: {}", filename, e.getMessage());
        } catch (SecurityException e) {
            log.warn("Security exception reading external AI reference file {}: {}", filename, e.getMessage());
        }
        return null;
    }

    /**
     * Try to load content from a bundled classpath resource.
     *
     * @param resourcePath The classpath resource path
     * @return Resource content or null if not found/readable
     */
    private String tryLoadBundledResource(String resourcePath) {
        try {
            ClassPathResource resource = new ClassPathResource(resourcePath);
            if (resource.exists()) {
                try (InputStream inputStream = resource.getInputStream()) {
                    return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
                }
            }
        } catch (IOException e) {
            log.warn("Failed to read bundled AI reference resource {}: {}", resourcePath, e.getMessage());
        }
        return null;
    }
}
