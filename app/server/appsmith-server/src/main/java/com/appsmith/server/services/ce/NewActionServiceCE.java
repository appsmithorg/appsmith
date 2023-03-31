package com.appsmith.server.services.ce;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.external.models.Param;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.LayoutActionUpdateDTO;
import com.appsmith.server.services.CrudService;
import org.springframework.data.domain.Sort;
import org.springframework.http.codec.multipart.Part;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

public interface NewActionServiceCE extends CrudService<NewAction, String> {

    Boolean validateActionName(String name);

    void setCommonFieldsFromActionDTOIntoNewAction(ActionDTO action, NewAction newAction);

    Mono<ActionDTO> generateActionByViewMode(NewAction newAction, Boolean viewMode);

    void generateAndSetActionPolicies(NewPage page, NewAction action);

    Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction);

    NewAction extractAndSetJsonPathKeys(NewAction newAction);

    Mono<ActionDTO> updateUnpublishedAction(String id, ActionDTO action);

    Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO, String environmentName);

    Mono<ActionExecutionResult> executeAction(Flux<Part> partsFlux, String branchName, String environmentName);

    Mono<ActionDTO> getValidActionForExecution(ExecuteActionDTO executeActionDTO, String actionId, NewAction newAction);

    <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap);

    Mono<ActionDTO> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission);

    Mono<ActionDTO> findActionDTObyIdAndViewMode(String id, Boolean viewMode, AclPermission permission);

    Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInPage(String pageId);

    Flux<NewAction> findUnpublishedActionsInPageByNames(Set<String> names, String pageId);

    Mono<NewAction> findById(String id);

    Mono<NewAction> findById(String id, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId, AclPermission permission);

    Flux<NewAction> findByPageId(String pageId, Optional<AclPermission> permission);

    Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission permission);

    Flux<NewAction> findAllByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission permission, Sort sort);

    Flux<NewAction> findAllByApplicationIdAndViewMode(String applicationId, Boolean viewMode, Optional<AclPermission> permission, Optional<Sort> sort);

    Flux<ActionViewDTO> getActionsForViewMode(String applicationId);

    Flux<ActionViewDTO> getActionsForViewMode(String defaultApplicationId, String branchName);

    Mono<ActionDTO> deleteUnpublishedAction(String id);

    Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params);

    Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params, String branchName);

    Mono<ActionDTO> populateHintMessages(ActionDTO action);

    Mono<NewAction> save(NewAction action);

    Flux<NewAction> saveAll(List<NewAction> actions);

    Flux<NewAction> findByPageId(String pageId);

    Mono<NewAction> archive(NewAction newAction);

    Mono<NewAction> archiveById(String id);

    Mono<List<NewAction>> archiveActionsByApplicationId(String applicationId, AclPermission permission);

    List<MustacheBindingToken> extractMustacheKeysInOrder(String query);

    String replaceMustacheWithQuestionMark(String query, List<String> mustacheBindings);

    Mono<Boolean> updateActionsExecuteOnLoad(List<ActionDTO> actions, String pageId, List<LayoutActionUpdateDTO> actionUpdates, List<String> messages);

    Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params);

    Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params, String branchName);

    Mono<NewAction> findByBranchNameAndDefaultActionId(String branchName, String defaultActionId, AclPermission permission);

    Mono<String> findBranchedIdByBranchNameAndDefaultActionId(String branchName, String defaultActionId, AclPermission permission);

    public Mono<NewAction> sanitizeAction(NewAction action);

    Mono<ActionDTO> fillSelfReferencingDataPaths(ActionDTO actionDTO);

    Map<String, Object> getAnalyticsProperties(NewAction savedAction);

    Mono<Void> parseExecuteActionPart(Part part, ExecuteActionDTO executeActionDTO);

    Mono<Void> parseExecuteParameterMapPart(Part part, ExecuteActionDTO dto);

    Mono<Param> parseExecuteParameter(Part part, AtomicLong totalReadableByteCount);

    Mono<Void> parseExecuteBlobs(Flux<Part> partsFlux, ExecuteActionDTO dto, AtomicLong totalReadableByteCount);

    String replaceBlobValuesInParam(String value, List<String> blobIdentifiers, Map<String, String> blobValuesMap);
}
