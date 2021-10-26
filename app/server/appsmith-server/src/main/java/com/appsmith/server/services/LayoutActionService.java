package com.appsmith.server.services;

import com.appsmith.external.helpers.AppsmithEventContext;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.RefactorActionNameDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Mono;

public interface LayoutActionService {
    Mono<LayoutDTO> updateLayout(String pageId, String layoutId, Layout layout);

    Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO);

    Mono<LayoutDTO> refactorWidgetName(RefactorNameDTO refactorNameDTO);

    Mono<LayoutDTO> refactorActionName(RefactorActionNameDTO refactorActionNameDTO);

    Mono<LayoutDTO> refactorName(String pageId, String layoutId, String oldName, String newName);

    Mono<Boolean> isNameAllowed(String pageId, String layoutId, String newName);

    Mono<ActionDTO> updateAction(String id, ActionDTO action);

    Mono<ActionDTO> updateSingleAction(String id, ActionDTO action);

    Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad);

    JSONObject unescapeMongoSpecialCharacters(Layout layout);

    Mono<ActionDTO> createAction(ActionDTO action);

    Mono<ActionDTO> createSingleAction(ActionDTO action);

    Mono<ActionDTO> createAction(ActionDTO action, AppsmithEventContext eventContext);

    Mono<ActionDTO> deleteUnpublishedAction(String id);
}
