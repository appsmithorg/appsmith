package com.appsmith.server.layouts;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.UpdateMultiplePageLayoutDTO;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface UpdateLayoutServiceCE {
    Mono<LayoutDTO> updateLayout(String pageId, String applicationId, String layoutId, Layout layout);

    Mono<Integer> updateMultipleLayouts(
            String defaultApplicationId, UpdateMultiplePageLayoutDTO updateMultiplePageLayoutDTO);

    JSONObject unescapeMongoSpecialCharacters(Layout layout);

    Mono<String> updatePageLayoutsByPageId(String pageId);

    Mono<List<Set<DslExecutableDTO>>> getOnPageLoadActions(
            String creatorId, String layoutId, Layout layout, Integer evaluatedVersion, CreatorContextType creatorType);

    Mono<String> updateLayoutByContextTypeAndContextId(CreatorContextType contextType, String contextId);
}
