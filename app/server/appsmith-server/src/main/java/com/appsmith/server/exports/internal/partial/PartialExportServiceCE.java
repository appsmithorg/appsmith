package com.appsmith.server.exports.internal.partial;

import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.PartialExportFileDTO;
import reactor.core.publisher.Mono;

public interface PartialExportServiceCE {
    Mono<ApplicationJson> getPartialExportResources(
            String branchedApplicationId, String branchedPageId, PartialExportFileDTO partialExportFileDTO);
}
