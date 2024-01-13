package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import reactor.core.publisher.Mono;

public interface LayoutActionServiceCE {

    Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO);

    Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO, String branchName);

    Mono<ActionDTO> updateAction(String id, ActionDTO action);

    Mono<ActionDTO> updateSingleAction(String id, ActionDTO action);

    Mono<ActionDTO> updateSingleActionWithBranchName(String id, ActionDTO action, String branchName);

    Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad);

    Mono<ActionDTO> setExecuteOnLoad(String defaultActionId, String branchName, Boolean isExecuteOnLoad);

    Mono<ActionDTO> createAction(ActionDTO action);

    Mono<ActionDTO> createSingleActionWithBranch(ActionDTO action, String branchName);

    Mono<ActionDTO> createSingleAction(ActionDTO action, Boolean isJsAction);

    Mono<ActionDTO> createAction(ActionDTO action, AppsmithEventContext eventContext, Boolean isJsAction);

    Mono<ActionDTO> deleteUnpublishedAction(String id);

    Mono<ActionDTO> deleteUnpublishedAction(String id, String branchName);
}
