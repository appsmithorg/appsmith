package com.appsmith.server.modules.crud.entity;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleEntitiesDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class CrudModuleEntityServiceCECompatibleImpl implements CrudModuleEntityServiceCECompatible {
    @Override
    public Mono<ActionDTO> updateModuleAction(ModuleActionDTO moduleActionDTO, String moduleId, String actionId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<ActionDTO>> getModuleActions(String moduleId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ModuleEntitiesDTO> getAllEntities(String contextId, CreatorContextType contextType, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
