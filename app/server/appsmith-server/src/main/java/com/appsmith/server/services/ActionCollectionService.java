package com.appsmith.server.services;

import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionDTO;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ActionCollectionService extends CrudService<ActionCollection, String> {
    Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collection);

    void  generateAndSetPolicies(NewPage page, ActionCollection actionCollection);

    Mono<Boolean> isDuplicateActionCollection(String name, MultiValueMap<String, String> params);

    Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(MultiValueMap<String, String> params, Boolean viewMode);

    Flux<ActionCollectionDTO> getActionCollectionsByViewMode(MultiValueMap<String, String> params, Boolean viewMode);

    Mono<ActionDTO> createAction(ActionDTO action);

    Mono<ActionDTO> updateAction(String id, ActionDTO action);

    Mono<ActionCollectionDTO> updateUnpublishedActionCollection(String id, ActionCollectionDTO actionCollectionDTO);

    Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(String id);

    Mono<ActionCollectionDTO> generateActionCollectionByViewMode(ActionCollection actionCollection, Boolean viewMode);
}
