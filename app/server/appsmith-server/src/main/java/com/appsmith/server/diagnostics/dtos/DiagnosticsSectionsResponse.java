package com.appsmith.server.diagnostics.dtos;

import java.util.List;

public record DiagnosticsSectionsResponse(String collectorVersion, List<DiagnosticsSectionResult> sections) {}
