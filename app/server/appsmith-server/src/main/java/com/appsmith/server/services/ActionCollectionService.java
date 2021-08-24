package com.appsmith.server.services;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionMoveDTO;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorActionCollectionNameDTO;
import org.springframework.data.domain.Sort;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ActionCollectionService extends CrudService<ActionCollection, String> {
    Flux<ActionCollection> findAllByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission permission, Sort sort);

    Mono<ActionCollectionDTO> createCollection(ActionCollectionDTO collection);

    void  generateAndSetPolicies(NewPage page, ActionCollection actionCollection);

    Mono<Boolean> isDuplicateActionCollection(String name, MultiValueMap<String, String> params);

    Flux<ActionCollection> saveAll(List<ActionCollection> collections);

    Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(MultiValueMap<String, String> params, Boolean viewMode);

    Flux<ActionCollectionDTO> getActionCollectionsByViewMode(MultiValueMap<String, String> params, Boolean viewMode);

    Mono<ActionDTO> createAction(ActionDTO action);

    Mono<ActionDTO> updateAction(String id, ActionDTO action);

    Mono<ActionCollectionDTO> refactorCollection(String id, ActionCollectionDTO actionCollectionDTO);

    Mono<ActionCollectionDTO> updateUnpublishedActionCollection(String id, ActionCollectionDTO actionCollectionDTO);

    Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(String id);

    Mono<ActionCollectionDTO> generateActionCollectionByViewMode(ActionCollection actionCollection, Boolean viewMode);

    Mono<ActionCollection> findById(String id, AclPermission aclPermission);

    Mono<ActionCollectionDTO> findActionCollectionDTObyIdAndViewMode(String id, Boolean viewMode, AclPermission permission);

    Mono<LayoutDTO> refactorCollectionName(RefactorActionCollectionNameDTO refactorActionCollectionNameDTO);

    Mono<ActionCollectionDTO> moveCollection(ActionCollectionMoveDTO actionCollectionMoveDTO);
}
