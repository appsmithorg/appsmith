package com.appsmith.server.services;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ExecuteActionDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import javax.validation.constraints.NotNull;
import java.util.Map;
import java.util.Set;

public interface NewActionService extends CrudService<NewAction, String> {
    Mono<Action> createAction(@NotNull Action action);

    Mono<Action> updateUnpublishedAction(String id, Action action);

    Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO);

    <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap);

    Mono<Action> saveAction(Action action);

    Mono<Action> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission);

    Flux<NewAction> findUnpublishedOnLoadActionsInPage(Set<String> names, String pageId);

    Mono<NewAction> findById(String id);

    Mono<NewAction> findById(String id, AclPermission aclPermission);
}
