package com.appsmith.server.actioncollections.base;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ActionCollectionViewDTO;
import com.appsmith.server.services.CrudService;
import org.springframework.data.domain.Sort;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

public interface ActionCollectionServiceCE extends CrudService<ActionCollection, String> {

    Flux<ActionCollection> findAllByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission, Sort sort);

    void generateAndSetPolicies(NewPage page, ActionCollection actionCollection);

    Mono<ActionCollection> save(ActionCollection collection);

    Flux<ActionCollection> saveAll(List<ActionCollection> collections);

    Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode);

    Flux<ActionCollectionDTO> getPopulatedActionCollectionsByViewMode(
            MultiValueMap<String, String> params, Boolean viewMode, String branchName);

    Mono<ActionCollectionDTO> populateActionCollectionByViewMode(
            ActionCollectionDTO actionCollectionDTO1, Boolean viewMode);

    Mono<ActionCollectionDTO> splitValidActionsByViewMode(
            ActionCollectionDTO actionCollectionDTO, List<ActionDTO> actionsList, Boolean viewMode);

    Flux<ActionCollectionDTO> getActionCollectionsByViewMode(MultiValueMap<String, String> params, Boolean viewMode);

    Mono<ActionCollectionDTO> update(String id, ActionCollectionDTO actionCollectionDTO);

    Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(String id);

    Mono<ActionCollectionDTO> deleteWithoutPermissionUnpublishedActionCollection(String id);

    Mono<ActionCollectionDTO> deleteUnpublishedActionCollection(String id, String branchName);

    Mono<ActionCollectionDTO> generateActionCollectionByViewMode(ActionCollection actionCollection, Boolean viewMode);

    Mono<ActionCollection> findById(String id, AclPermission aclPermission);

    Mono<ActionCollectionDTO> findActionCollectionDTObyIdAndViewMode(
            String id, Boolean viewMode, AclPermission permission);

    Flux<ActionCollectionViewDTO> getActionCollectionsForViewMode(String applicationId, String branchName);

    Flux<ActionCollection> findByPageId(String pageId);

    Flux<ActionCollection> findByListOfPageIds(List<String> pageIds, Optional<AclPermission> permission);

    Mono<ActionCollection> findByBranchNameAndDefaultCollectionId(
            String branchName, String defaultCollectionId, AclPermission permission);

    Mono<List<ActionCollection>> archiveActionCollectionByApplicationId(String applicationId, AclPermission permission);

    void populateDefaultResources(
            ActionCollection actionCollection, ActionCollection branchedActionCollection, String branchName);

    Flux<ActionCollection> findAllActionCollectionsByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, AclPermission permission, boolean viewMode);

    Mono<ActionCollectionDTO> validateAndSaveCollection(ActionCollection actionCollection);
}
