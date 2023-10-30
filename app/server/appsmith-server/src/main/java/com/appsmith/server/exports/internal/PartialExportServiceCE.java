package com.appsmith.server.exports.internal;

import com.appsmith.server.dtos.ExportFileDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;

public interface PartialExportServiceCE {
    Mono<ExportFileDTO> getPartialExportResources(
            String applicationId,
            String pageId,
            String branchName,
            MultiValueMap<String, String> params,
            String widgets);
}
