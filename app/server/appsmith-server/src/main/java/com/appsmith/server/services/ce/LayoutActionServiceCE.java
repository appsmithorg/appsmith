package com.appsmith.server.services.ce;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Mono;

public interface LayoutActionServiceCE {

    Mono<LayoutDTO> updateLayout(String pageId, String layoutId, Layout layout);

    Mono<LayoutDTO> updateLayout(String pageId, String layoutId, Layout layout, String branchName);

    Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO);

    Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO, String branchName);

    Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO);

    Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO, String branchName);

    Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO);

    Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO, String branchName);

    Mono<LayoutDTO> refactorName(String pageId, String layoutId, String oldName, String newName);

    Mono<Boolean> isNameAllowed(String pageId, String layoutId, String newName);

    Mono<ActionDTO> updateAction(String id, ActionDTO action);

    Mono<ActionDTO> updateSingleAction(String id, ActionDTO action);

    Mono<ActionDTO> updateSingleActionWithBranchName(String id, ActionDTO action, String branchName);

    Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad);

    Mono<ActionDTO> setExecuteOnLoad(String defaultActionId, String branchName, Boolean isExecuteOnLoad);

    JSONObject unescapeMongoSpecialCharacters(Layout layout);

    Mono<ActionDTO> createAction(ActionDTO action);

    Mono<ActionDTO> createSingleActionWithBranch(ActionDTO action, String branchName);

    Mono<ActionDTO> createSingleAction(ActionDTO action);

    Mono<ActionDTO> createAction(ActionDTO action, AppsmithEventContext eventContext);

    Mono<ActionDTO> deleteUnpublishedAction(String id);

    Mono<ActionDTO> deleteUnpublishedAction(String id, String branchName);

}
