package com.appsmith.server.services;

import com.appsmith.external.models.ActionExecutionResult;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionViewDTO;
import com.appsmith.server.dtos.ExecuteActionDTO;
import org.springframework.data.domain.Sort;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface NewActionService extends CrudService<NewAction, String> {

    Mono<ActionDTO> generateActionByViewMode(NewAction newAction, Boolean viewMode);

    Mono<ActionDTO> createAction(ActionDTO action);

    NewAction extractAndSetJsonPathKeys(NewAction newAction);

    Mono<ActionDTO> updateUnpublishedAction(String id, ActionDTO action);

    Mono<ActionExecutionResult> executeAction(ExecuteActionDTO executeActionDTO);

    <T> T variableSubstitution(T configuration, Map<String, String> replaceParamsMap);

    Mono<ActionDTO> findByUnpublishedNameAndPageId(String name, String pageId, AclPermission permission);

    Flux<NewAction> findUnpublishedOnLoadActionsInPage(Set<String> names, String pageId);

    Mono<NewAction> findById(String id);

    Mono<NewAction> findById(String id, AclPermission aclPermission);

    Flux<NewAction> findByPageId(String pageId, AclPermission permission);

    Flux<NewAction> findByPageIdAndViewMode(String pageId, Boolean viewMode, AclPermission permission);

    Flux<NewAction> findAllByApplicationIdAndViewMode(String applicationId, Boolean viewMode, AclPermission permission, Sort sort);

    Flux<ActionViewDTO> getActionsForViewMode(String applicationId);

    Mono<ActionDTO> deleteUnpublishedAction(String id);

    Flux<ActionDTO> getUnpublishedActions(MultiValueMap<String, String> params);

    Mono<NewAction> save(NewAction action);

    Flux<NewAction> saveAll(List<NewAction> actions);

    Flux<NewAction> findByPageId(String pageId);
}
