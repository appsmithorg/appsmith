package com.appsmith.server.moduleinstances.moduleconvertible;

import com.appsmith.server.dtos.ConvertToModuleRequestDTO;
import com.appsmith.server.dtos.CreateExistingEntityToModuleResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
@Service
public class EntityToModuleConverterServiceCECompatibleImpl implements EntityToModuleConverterServiceCECompatible {
    @Override
    public Mono<CreateExistingEntityToModuleResponseDTO> convertExistingEntityToModule(
            ConvertToModuleRequestDTO convertToModuleRequestDTO, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
