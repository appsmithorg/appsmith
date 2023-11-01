package com.appsmith.server.exports.internal;

import com.appsmith.server.dtos.ExportFileDTO;
import com.appsmith.server.dtos.PartialExportFileDTO;
import reactor.core.publisher.Mono;

public interface PartialExportServiceCE {
    Mono<ExportFileDTO> getPartialExportResources(
            String applicationId, String pageId, String branchName, PartialExportFileDTO partialExportFileDTO);
}
