package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.McpKey;
import com.appsmith.server.repositories.AppsmithRepository;
import reactor.core.publisher.Mono;

public interface CustomMcpKeyRepositoryCE extends AppsmithRepository<McpKey> {

    /**
     * Counts the MCP keys that are not deleted and not revoked, for support diagnostics. A key without
     * {@code revokedAt} is not revoked. Keys have no expiry date, so the count can include keys whose tokens expired.
     *
     * <p>No ACL. Call only behind the super-user check in {@code SupportDiagnosticsServiceCEImpl}.
     */
    Mono<Long> countActiveForDiagnostics();
}
