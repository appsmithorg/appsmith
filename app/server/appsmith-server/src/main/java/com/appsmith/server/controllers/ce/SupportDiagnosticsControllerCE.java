package com.appsmith.server.controllers.ce;

import com.appsmith.external.views.Views;
import com.appsmith.server.constants.Url;
import com.appsmith.server.diagnostics.SupportDiagnosticsService;
import com.appsmith.server.diagnostics.dtos.DiagnosticsDownloadRequest;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionId;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionResult;
import com.appsmith.server.diagnostics.dtos.DiagnosticsSectionsResponse;
import com.appsmith.server.dtos.ResponseDTO;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

@RequestMapping(Url.SUPPORT_DIAGNOSTICS_URL)
@RequiredArgsConstructor
@Slf4j
public class SupportDiagnosticsControllerCE {

    private final SupportDiagnosticsService supportDiagnosticsService;

    @JsonView(Views.Public.class)
    @GetMapping("/sections")
    public Mono<ResponseDTO<DiagnosticsSectionsResponse>> listSections() {
        log.debug("Listing support diagnostics sections");
        return supportDiagnosticsService.listSections().map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/sections/{sectionId}/collect")
    public Mono<ResponseDTO<DiagnosticsSectionResult>> collect(@PathVariable DiagnosticsSectionId sectionId) {
        log.debug("Collecting support diagnostics section {}", sectionId);
        return supportDiagnosticsService.collect(sectionId).map(data -> new ResponseDTO<>(HttpStatus.OK, data));
    }

    @JsonView(Views.Public.class)
    @PostMapping("/downloads")
    public Mono<ResponseDTO<Void>> recordDownload(@Valid @RequestBody DiagnosticsDownloadRequest request) {
        log.debug("Recording support diagnostics download");
        return supportDiagnosticsService.recordDownload(request).thenReturn(new ResponseDTO<>(HttpStatus.OK, null));
    }
}
