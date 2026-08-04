package com.appsmith.server.services.ce;

/**
 * Service for loading AI reference documentation.
 * These files contain mode-specific context (JavaScript, SQL, GraphQL patterns)
 * that enhance AI assistant system prompts.
 *
 * Loading strategy:
 * 1. Bundled classpath resource: classpath:ai-references/{mode}-reference.md
 * 2. Inline fallback: Hardcoded minimal prompt
 *
 * To add a new mode, add a bundled .md file and (optionally) an inline fallback entry.
 * To swap the loading strategy entirely (e.g. fetch from a remote config service),
 * provide an alternative implementation of this interface.
 */
public interface AIReferenceServiceCE {

    /**
     * Get the reference content for a specific mode.
     *
     * @param mode The editor mode (javascript, sql, graphql)
     * @return The reference content, or inline fallback if the bundled file is unavailable
     */
    String getReferenceContent(String mode);

    /**
     * Get common issues content that applies across all modes.
     *
     * @return The common issues content, or empty string if unavailable
     */
    String getCommonIssuesContent();
}
