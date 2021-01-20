package com.appsmith.server.services;

import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.ActionDTO;
import com.appsmith.server.dtos.ActionMoveDTO;
import com.appsmith.server.dtos.RefactorNameDTO;
import org.jgrapht.graph.AbstractBaseGraph;
import org.jgrapht.graph.DefaultEdge;
import reactor.core.publisher.Mono;

public interface LayoutActionService {
    public Mono<Layout> updateLayout(String pageId, String layoutId, Layout layout);

    public Mono<ActionDTO> moveAction(ActionMoveDTO actionMoveDTO);

    public Mono<Layout> refactorWidgetName(RefactorNameDTO refactorNameDTO);

    public Mono<Layout> refactorActionName(RefactorNameDTO refactorNameDTO);

    public Mono<ActionDTO> updateAction(String id, ActionDTO action);

    Mono<ActionDTO> setExecuteOnLoad(String id, Boolean isExecuteOnLoad);

    AbstractBaseGraph<String, DefaultEdge> findPageLoadActionsSchedulingOrder();
}
