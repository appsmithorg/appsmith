package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import reactor.core.publisher.Mono;

public interface LayoutActionService {
    public Mono<Layout> updateLayout(String pageId, String layoutId, Layout layout);

    public Mono<Action> moveAction(ActionMoveDTO actionMoveDTO);

    public Mono<Layout> refactorWidgetName(RefactorNameDTO refactorNameDTO);

    public Mono<Layout> refactorActionName(RefactorNameDTO refactorNameDTO);

    public Mono<Action> updateAction(String id, Action action);
}
