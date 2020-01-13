package com.appsmith.server.services;

import com.appsmith.server.domains.Action;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ActionMoveDTO;
import reactor.core.publisher.Mono;

public interface LayoutActionService {
    public Mono<Layout> updateLayout(String pageId, String layoutId, Layout layout);

    public Mono<Action> moveAction(ActionMoveDTO actionMoveDTO);
}
