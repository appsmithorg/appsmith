package com.appsmith.server.bbhack;

import com.appsmith.server.domains.BuildingBlockHack;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.BBMainDTO;
import com.appsmith.server.dtos.BBResponseDTO;
import reactor.core.publisher.Mono;

import java.util.List;

public interface BBService {
    Mono<BBResponseDTO> createCustomBuildingBlock(BBMainDTO bbMainDTO);

    Mono<List<BBResponseDTO>> fetchAllBuildingBlocks();

    Mono<List<BBResponseDTO>> fetchAllBuildingBlocksLite();

    Mono<ApplicationJson> prepareApplicationJsonFromBB(BuildingBlockHack buildingBlockHack);
}
