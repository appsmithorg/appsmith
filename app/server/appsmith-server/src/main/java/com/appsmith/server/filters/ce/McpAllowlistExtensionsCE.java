package com.appsmith.server.filters.ce;

import com.appsmith.server.filters.McpAllowRule;

import java.util.List;
import java.util.Set;

/**
 * Edition extension point for the MCP-principal allowlist. {@code McpAllowlistWebFilter} appends
 * {@link #extensionRules()} to its core rules, so an edition that ships extra MCP tools (EE: workflows) can allow the
 * endpoints those tools call by overriding {@code McpAllowlistExtensions}, without editing the shared filter.
 *
 * <p>CE ships no extension tools, so it adds no rules, prefixes or reserved segments. Everything an override returns is
 * validated by the filter at construction, so a bad declaration stops startup instead of silently widening what an MCP
 * token can reach: every rule must live under one of {@link #extensionPathPrefixes()}, which must be a literal route
 * family of the edition's own (never one the core rules already cover); catch-all patterns, regex-constrained
 * variables and anything touching the MCP token-management routes are refused. Use
 * {@code McpAllowRule.rule(HttpMethod.X, "...")} for each entry — the MCP package's route-contract test parses that
 * exact form.
 *
 * <p>A plain class the filter constructs with {@code new}, NOT a Spring bean (the filter itself is built with {@code new}
 * in SecurityConfig): there is no dependency injection, so the rules must be static declarations that depend on nothing
 * at runtime.
 * The allowlist only caps which routes an MCP token may reach; the server-side services behind those routes remain the
 * entitlement / licence control.
 */
public class McpAllowlistExtensionsCE {

    /** Extra method+path rules the edition's MCP tools need. Each must live under {@link #extensionPathPrefixes()}. */
    public List<McpAllowRule> extensionRules() {
        return List.of();
    }

    /**
     * The literal path prefixes the edition's rules must live under (EE: {@code /api/v1/workflows}). Each must start
     * with {@code /api/v1/}, carry no pattern syntax or trailing slash, and name a route family no core rule uses — so
     * an extension can never widen access inside a family the core allowlist already curates.
     */
    public List<String> extensionPathPrefixes() {
        return List.of();
    }

    /**
     * Sibling literal route segments under {@link #extensionPathPrefixes()} that must never satisfy a {@code {var}}
     * segment (e.g. {@code token}, {@code publish}, {@code export}). Matched case-insensitively against the final path
     * segment, and scoped to request paths under {@link #extensionPathPrefixes()} (segment-boundary match): they never
     * apply to core routes, so reserving a literal a core route also uses cannot deny that core route. The core
     * reserved segments still apply to every path, including those under the extension prefixes.
     */
    public Set<String> extensionReservedSegments() {
        return Set.of();
    }
}
