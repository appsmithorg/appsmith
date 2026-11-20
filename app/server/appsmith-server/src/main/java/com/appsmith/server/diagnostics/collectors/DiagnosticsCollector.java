package com.appsmith.server.diagnostics.collectors;

import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

/**
 * Collects one support diagnostics section. Implementations are Spring beans, one per section. Two collectors for the
 * same section stop the application at startup.
 *
 * <p>Every implementation must follow these rules:
 *
 * <ul>
 *   <li>Return aggregates only: counts, and values from fixed lists. The redaction guard rejects any key that
 *       {@link #allowedKeys()} does not declare.
 *   <li>Never throw from {@link #collect()}. Signal an error through the returned {@link Mono}.
 *   <li>Never put a connection string, URL, hostname, or customer data in an exception message.
 *   <li>Stay fully reactive. Do not call {@code .block()}. Use bounded, indexed count queries. The service cancels a
 *       collection after 10 seconds, but cancellation cannot interrupt blocking work.
 * </ul>
 */
public interface DiagnosticsCollector {

    DiagnosticsSectionId sectionId();

    /** Top-level keys this collector may return. The redaction guard rejects any other key. */
    Set<String> allowedKeys();

    Mono<Map<String, Object>> collect();
}
