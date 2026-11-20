package com.appsmith.server.diagnostics;

import com.appsmith.server.diagnostics.dtos.DiagnosticsDownloadRequest;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionResult;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionsResponse;
import reactor.core.publisher.Mono;

import java.time.Duration;

public interface SupportDiagnosticsServiceCE {

    String COLLECTOR_VERSION = "1";

    Duration COLLECT_TIMEOUT = Duration.ofSeconds(10);

    Mono<DiagnosticsSectionsResponse> listSections();

    Mono<DiagnosticsSectionResult> collect(DiagnosticsSectionId sectionId);

    Mono<Void> recordDownload(DiagnosticsDownloadRequest request);
}
