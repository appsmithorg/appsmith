package com.appsmith.server.services;

import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import reactor.core.publisher.Mono;

public interface LayoutActionService {
    Mono<Layout> updateLayout(String pageId, String layoutId, Layout layout);

    Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO);

    Mono<Layout> refactorWidgetName(RefactorNameDTO refactorNameDTO);

    Mono<Layout> refactorActionName(RefactorNameDTO refactorNameDTO);

    Mono<ActionDTO> updateAction(String id, ActionDTO action);

    Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad);
}
