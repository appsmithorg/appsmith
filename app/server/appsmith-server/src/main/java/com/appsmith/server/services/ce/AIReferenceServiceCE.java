package com.appsmith.server.services.ce;

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
}
