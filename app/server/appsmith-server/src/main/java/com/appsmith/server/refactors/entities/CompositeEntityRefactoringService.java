package com.appsmith.server.refactors.entities;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.RefactorEntityNameDTO;
import reactor.core.publisher.Flux;

public interface CompositeEntityRefactoringService<T> {

    Flux<NewAction> getComposedNewActions(RefactorEntityNameDTO refactorEntityNameDTO);

    Flux<ActionCollection> getComposedActionCollections(RefactorEntityNameDTO refactorEntityNameDTO);

    Flux<ModuleInstance> getComposedModuleInstances(RefactorEntityNameDTO refactorEntityNameDTO);
}
