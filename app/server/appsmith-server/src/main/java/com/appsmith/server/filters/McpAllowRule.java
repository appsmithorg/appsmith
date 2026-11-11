package com.appsmith.server.filters;

import org.springframework.http.HttpMethod;
import org.springframework.http.server.PathContainer;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

/**
 * One method + path-pattern entry on the MCP-principal allowlist ({@link McpAllowlistWebFilter}). Shared by the core
 * rule list and the edition extension rules ({@link McpAllowlistExtensions}) so both are matched identically.
 */
public record McpAllowRule(HttpMethod method, PathPattern pattern) {

    private static final PathPatternParser PARSER = new PathPatternParser();

    public static McpAllowRule rule(HttpMethod method, String pattern) {
        return new McpAllowRule(method, PARSER.parse(pattern));
    }

    boolean matches(HttpMethod requestMethod, PathContainer path) {
        return method.equals(requestMethod) && pattern.matches(path);
    }
}
