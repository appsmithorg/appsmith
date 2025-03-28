package com.appsmith.server.newactions.base;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ImportActionCollectionResultDTO;
import com.appsmith.server.dtos.ImportActionResultDTO;
import com.appsmith.server.dtos.ImportedActionAndCollectionMapsDTO;
import com.appsmith.server.dtos.PluginTypeAndCountDTO;
import com.appsmith.server.services.CrudService;
import org.springframework.data.domain.Sort;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface NewActionServiceCE extends CrudService<NewAction, String> {

    void setCommonFieldsFromActionDTOIntoNewAction(ActionDTO action, NewAction newAction);

    ActionDTO generateActionByViewMode(NewAction newAction, Boolean viewMode);

    void generateAndSetActionPolicies(NewPage page, NewAction action);

    Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction);

    Mono<NewAction> validateAction(NewAction newAction);

    Mono<NewAction> validateAction(NewAction newAction, boolean isDryOps);

    Mono<Void> bulkValidateAndInsertActionInRepository(List<NewAction> newActionList);

    Mono<Void> bulkValidateAndUpdateActionInRepository(List<NewAction> newActionList);

    Mono<NewAction> extractAndSetJsonPathKeys(NewAction newAction);

    Mono<ActionDTO> updateUnpublishedAction(String id, ActionDTO action);

    Mono<Tuple2<ActionDTO, NewAction>> updateUnpublishedActionWithoutAnalytics(
            String id, ActionDTO action, AclPermission permission);

    Mono<ActionDTO> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission);

    Mono<ActionDTO> findActionDTObyIdAndViewMode(String id, Boolean viewMode, AclPermission permission);

    Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInPage(String pageId);

    Mono<NewAction> findById(String id);

    Flux<NewAction> findAllById(Iterable<String> id);

    Mono<NewAction> findById(String id, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId, AclPermission permission);

    Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> permission);

    Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission permission);

    Flux<NewAction> findAllByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, AclPermission permission, Sort sort);

    Flux<NewAction> findAllByApplicationIdAndViewMode(
            String applicationId, Boolean viewMode, Optional<AclPermission> permission, Optional<Sort> sort);

    Flux<ActionViewDTO> getActionsForViewMode(String applicationId);

    Flux<ActionViewDTO> getActionsForViewModeByPageId(String pageId);

    ActionViewDTO generateActionViewDTO(NewAction action, ActionDTO actionDTO, boolean viewMode);

    Mono<ActionDTO> deleteUnpublishedAction(String id);

    Mono<ActionDTO> deleteUnpublishedAction(String id, AclPermission newActionDeletePermission);

    Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params, Boolean includeJsActions);

    Flux<ActionDTO> getUnpublishedActions(
            MultiValueMap<String, String> params, RefType refType, String refName, Boolean includeJsActions);

    Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params);

    Flux<ActionDTO> getUnpublishedActionsByPageId(String pageId, AclPermission permission);

    Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params, RefType refType, String refName);

    Mono<ActionDTO> deleteGivenNewAction(NewAction toDelete);

    Mono<ActionDTO> populateHintMessages(ActionDTO action);

    Mono<NewAction> save(NewAction action);

    Flux<NewAction> saveAll(List<NewAction> actions);

    Flux<NewAction> findByPageId(String pageId);

    Mono<NewAction> archiveGivenNewAction(NewAction toDelete);

    Mono<NewAction> archive(NewAction newAction);

    Mono<NewAction> archiveById(String id);

    Mono<List<NewAction>> archiveActionsByApplicationId(String applicationId, AclPermission permission);

    Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params);

    Mono<NewAction> sanitizeAction(NewAction action);

    Mono<ActionDTO> fillSelfReferencingDataPaths(ActionDTO actionDTO);

    Map<String, Object> getAnalyticsProperties(NewAction savedAction);

    Mono<ImportedActionAndCollectionMapsDTO> updateActionsWithImportedCollectionIds(
            ImportActionCollectionResultDTO importActionCollectionResultDTO,
            ImportActionResultDTO importActionResultDTO);

    Mono<Void> publishActions(String applicationId, AclPermission permission);

    Flux<PluginTypeAndCountDTO> countActionsByPluginType(String applicationId);

    Flux<NewAction> findByPageIdsForExport(List<String> unpublishedPages, Optional<AclPermission> optionalPermission);

    Flux<NewAction> findAllActionsByContextIdAndContextTypeAndViewMode(
            String contextId,
            CreatorContextType contextType,
            AclPermission permission,
            boolean viewMode,
            boolean includeJs);

    NewAction generateActionDomain(ActionDTO action);

    Mono<Void> saveLastEditInformationInParent(ActionDTO actionDTO);

    Flux<NewAction> findByCollectionIdAndViewMode(String collectionId, boolean viewMode, AclPermission aclPermission);

    Mono<Void> postProcessDeletedActions(List<ActionDTO> actionDTOs);
}
