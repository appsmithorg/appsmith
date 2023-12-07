package com.appsmith.server.modules.crud;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.modules.base.BaseModuleServiceImpl;
import com.appsmith.server.repositories.ModuleRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class CrudModuleServiceCECompatibleImpl extends BaseModuleServiceImpl implements CrudModuleServiceCECompatible {
    public CrudModuleServiceCECompatibleImpl(ModuleRepository moduleRepository) {
        super(moduleRepository);
    }

    @Override
    public Mono<ModuleDTO> createModule(ModuleDTO moduleDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ModuleDTO> updateModule(ModuleDTO moduleResource, String moduleId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ActionDTO> createPrivateModuleAction(ActionDTO action, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<ActionCollectionDTO> createPrivateModuleActionCollection(
            ActionCollectionDTO actionCollectionDTO, String branchName) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
