package com.appsmith.server.services;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ExecuteActionDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;

public interface ActionService extends CrudService<Action, String> {

    Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO);

    Mono<Action> save(Action action);

    Mono<Action> findByNameAndPageId(String name, String pageId, AclPermission permission);

    Flux<Action> findOnLoadActionsInPage(Set<String> names, String pageId);

    Mono<Action> validateAndSaveActionToRepository(Action action);

    Action extractAndSetJsonPathKeys(Action action);

    <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap);

    Mono<Action> findById(String id);

    Flux<Action> findByPageId(String pageId, AclPermission permission);

    Flux<ActionViewDTO> getActionsForViewMode(String applicationId);

}
