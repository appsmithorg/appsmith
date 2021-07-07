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

    Mono<ActionDTO> updateAction(String id, ActionDTO action);

    Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad);

    JSONObject unescapeMongoSpecialCharacters(Layout layout);

    Mono<ActionDTO> createAction(ActionDTO action);

    Mono<ActionDTO> createAction(ActionDTO action, AppsmithEventContext eventContext);
}
