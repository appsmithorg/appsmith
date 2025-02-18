package com.appsmith.server.imports.internal.partial;

import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.BuildingBlockDTO;
import com.appsmith.server.dtos.BuildingBlockResponseDTO;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Mono;

public interface PartialImportServiceCE {

    Mono<Application> importResourceInPage(
            String workspaceId, String applicationId, String pageId, String branchName, Part file);

    Mono<Application> importResourceInPage(
            String workspaceId, String applicationId, String pageId, String branchName, String fileContents);

    Mono<BuildingBlockResponseDTO> importBuildingBlock(BuildingBlockDTO buildingBlockDTO);
}
