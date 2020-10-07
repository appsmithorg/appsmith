package com.appsmith.server.services;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ExecuteActionDTO;
import org.springframework.data.domain.Sort;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface NewActionService extends CrudService<NewAction, String> {
    Action createActionFromDTO(ActionDTO actionDTO);

    Mono<Action> generateActionByViewMode(NewAction newAction, Boolean viewMode);

    Mono<Action> createAction(@NotNull Action action);

    NewAction extractAndSetJsonPathKeys(NewAction newAction);

    Mono<Action> updateUnpublishedAction(String id, Action action);

    Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO);

    <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap);

    Mono<Action> saveAction(Action action);

    Mono<Action> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission);

    Flux<NewAction> findUnpublishedOnLoadActionsInPage(Set<String> names, String pageId);

    Mono<NewAction> findById(String id);

    Mono<NewAction> findById(String id, AclPermission aclPermission);

    abstract Flux<NewAction> findByPageId(String pageId, AclPermission permission);

    Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission permission);

    Flux<NewAction> findAllByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission permission, Sort sort);

    Flux<ActionViewDTO> getActionsForViewMode(String applicationId);

    Mono<Action> deleteUnpublishedAction(String id);

    Flux<Action> getUnpublishedActions(MultiValueMap<String, String> params);

    Mono<NewAction> save(NewAction action);

    Flux<NewAction> saveAll(List<NewAction> actions);

    Flux<NewAction> findByPageId(String pageId);
}
