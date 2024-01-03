package com.appsmith.server.moduleinstances.moduleconvertible;

import com.appsmith.server.dtos.ConvertToModuleRequestDTO;
import com.appsmith.server.dtos.CreateExistingEntityToModuleResponseDTO;
import reactor.core.publisher.Mono;

public interface EntityToModuleConverterServiceCECompatible {
    Mono<CreateExistingEntityToModuleResponseDTO> convertExistingEntityToModule(
            ConvertToModuleRequestDTO convertToModuleRequestDTO, String branchName);
}
