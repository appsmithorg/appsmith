package com.appsmith.server.diagnostics.dtos;

import java.time.Instant;
import java.util.Map;

public record DiagnosticsSectionResult(
        DiagnosticsSectionId sectionId,
        DiagnosticsStatus status,
        Instant collectedAt,
        Map<String, Object> data,
        String errorCode) {

    public static DiagnosticsSectionResult ok(
            DiagnosticsSectionId sectionId, Map<String, Object> data, Instant collectedAt) {
        return new DiagnosticsSectionResult(sectionId, DiagnosticsStatus.OK, collectedAt, data, null);
    }

    public static DiagnosticsSectionResult unavailable(DiagnosticsSectionId sectionId, String errorCode) {
        return new DiagnosticsSectionResult(sectionId, DiagnosticsStatus.UNAVAILABLE, null, null, errorCode);
    }

    public static DiagnosticsSectionResult notCollected(DiagnosticsSectionId sectionId) {
        return new DiagnosticsSectionResult(sectionId, DiagnosticsStatus.NOT_COLLECTED, null, null, null);
    }

    public static DiagnosticsSectionResult notSupported(DiagnosticsSectionId sectionId) {
        return new DiagnosticsSectionResult(sectionId, DiagnosticsStatus.NOT_SUPPORTED, null, null, null);
    }
}
