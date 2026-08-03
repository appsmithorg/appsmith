package com.appsmith.server.constants.ce;

/**
 * The single interpretation of the {@code APPSMITH_MCP_ENABLED} environment gate.
 *
 * <p>This is an allow-list, not a deny-list: MCP is OFF unless an operator explicitly opted in with a recognized
 * truthy value. An absent, blank, or unrecognized value therefore means disabled, so no instance can acquire an
 * agent-facing endpoint merely by upgrading into it.
 *
 * <p>The gate is security-critical and had been implemented <b>three</b> times, all with the identical regex:
 *
 * <ul>
 *   <li>{@code SecurityConfig} — whether the MCP bearer-auth filter engages at all;
 *   <li>{@code McpTokenControllerCE} — whether tokens may be minted or rotated;
 *   <li>{@code UserServiceCEImpl} — whether the Profile page offers the MCP-token UI (via
 *       {@code UserProfileCE_DTO.isMcpEnabled}).
 * </ul>
 *
 * <p>Copies of the same regex drift apart during an ordinary edit or a CE&rarr;EE merge with no compile error to
 * catch it, and {@code SecurityConfig} is already a fully diverged file in EE. A single shared definition removes
 * that class of bug: the filter, the minting guard, and the UI cannot disagree about what "enabled" means.
 *
 * <p><b>On placement.</b> This is a policy predicate, not a constant, and it carries no {@code CE} suffix — so
 * unlike its package-mates ({@code FieldNameCE}, {@code UrlCE}, &hellip;) it is not an EE extension seam. It sits
 * here alongside {@link McpHeaders} to keep the MCP shared-wiring vocabulary in one place, and because a static
 * method is not polymorphic there is nothing for EE to override: <b>EE must call this, never re-inline the regex
 * or subclass it.</b> When MCP reaches EE, EE's diverged {@code SecurityConfig} has to delegate here too.
 *
 * <p>The shell and Caddy layers ({@code run-mcp.sh}, {@code healthcheck.sh}, {@code caddy-reconfigure.mjs}) carry
 * unavoidable cross-language copies of the same truthy set; {@code deploy-gating.test.ts} pins those.
 */
public class McpEnvGate {

    private McpEnvGate() {}

    /**
     * The recognized truthy spellings of the gate. Case-insensitive; the value is trimmed before matching.
     */
    private static final String TRUTHY = "(?i)^(true|1|yes|on)$";

    /**
     * @param flagValue the raw {@code APPSMITH_MCP_ENABLED} value, which may be {@code null} or blank
     * @return {@code true} only when the value is a recognized truthy spelling
     */
    public static boolean isEnabled(String flagValue) {
        return flagValue != null && flagValue.trim().matches(TRUTHY);
    }
}
