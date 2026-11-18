package com.appsmith.server.diagnostics.dtos;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record DiagnosticsDownloadRequest(@NotEmpty List<DiagnosticsSectionId> sectionIds, boolean encrypted) {}
