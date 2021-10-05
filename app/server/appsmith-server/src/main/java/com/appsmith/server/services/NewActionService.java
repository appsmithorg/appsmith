package com.appsmith.server.services;

import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.LayoutActionUpdateDTO;
import org.springframework.data.domain.Sort;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface NewActionService extends CrudService<NewAction, String> {

    Boolean validateActionName(String name);

    void setCommonFieldsFromActionDTOIntoNewAction(ActionDTO action, NewAction newAction);

    Mono<ActionDTO> generateActionByViewMode(NewAction newAction, Boolean viewMode);

    void generateAndSetActionPolicies(NewPage page, NewAction action);

    Mono<ActionDTO> validateAndSaveActionToRepository(NewAction newAction);

    NewAction extractAndSetJsonPathKeys(NewAction newAction);

    Mono<ActionDTO> updateUnpublishedAction(String id, ActionDTO action);

    Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO);

    <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap);

    Mono<ActionDTO> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission);

    Mono<ActionDTO> findActionDTObyIdAndViewMode(String id, Boolean viewMode, AclPermission permission);

    Flux<NewAction> findUnpublishedOnLoadActionsExplicitSetByUserInPage(String pageId);

    Flux<NewAction> findUnpublishedActionsInPageByNames(Set<String> names, String pageId);

    Mono<NewAction> findById(String id);

    Mono<NewAction> findById(String id, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId, AclPermission permission);

    Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission permission);

    Flux<NewAction> findAllByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission permission, Sort sort);

    Flux<ActionViewDTO> getActionsForViewMode(String applicationId);

    Mono<ActionDTO> deleteUnpublishedAction(String id);

    Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params);

    Mono<ActionDTO> populateHintMessages(ActionDTO action);

    Mono<NewAction> save(NewAction action);

    Flux<NewAction> saveAll(List<NewAction> actions);

    Flux<NewAction> findByPageId(String pageId);

    Mono<NewAction> archive(String id);

    Mono<List<NewAction>> archiveActionsByApplicationId(String applicationId, AclPermission permission);

    List<String> extractMustacheKeysInOrder(String query);

    String replaceMustacheWithQuestionMark(String query, List<String> mustacheBindings);

    Mono<Boolean> updateActionsExecuteOnLoad(List<ActionDTO> actions, String pageId, List<LayoutActionUpdateDTO> actionUpdates, List<String> messages);

    Flux<ActionDTO> getUnpublishedActionsExceptJs(MultiValueMap<String, String> params);
}
