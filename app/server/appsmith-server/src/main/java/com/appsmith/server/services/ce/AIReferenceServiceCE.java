package com.appsmith.server.services.ce;

import java.util.Map;

/**
 * Service for loading AI reference documentation files.
 * These files contain mode-specific context (JavaScript, SQL, GraphQL patterns)
 * that enhance AI assistant system prompts.
 *
 * The service implements a fallback chain:
 * 1. External path: /appsmith/config/ai-references/{mode}-reference.md (configurable)
 * 2. Bundled resource: classpath:ai-references/{mode}-reference.md
 * 3. Inline fallback: Hardcoded minimal prompt
 */
public interface AIReferenceServiceCE {

    /**
     * Get the reference content for a specific mode.
     *
     * @param mode The editor mode (javascript, sql, graphql)
     * @return The reference content, or inline fallback if files are unavailable
     */
    String getReferenceContent(String mode);

    /**
     * Get common issues content that applies across all modes.
     *
     * @return The common issues content, or empty string if unavailable
     */
    String getCommonIssuesContent();

    /**
     * Get information about which AI reference files are being used.
     * Returns a map with file names as keys and source info as values.
     *
     * @return Map of filename to source (e.g., "external:/path/to/file" or "bundled" or "inline-fallback")
     */
    Map<String, ReferenceFileInfo> getReferenceFilesInfo();

    /**
     * Information about a reference file source.
     */
    record ReferenceFileInfo(
            String source, // "external", "bundled", or "inline-fallback"
            String path, // Full path for external files, null otherwise
            boolean exists // Whether the file exists
            ) {}
}
