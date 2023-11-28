package com.appsmith.server.layouts;

import com.appsmith.server.domains.Layout;
import com.appsmith.server.dtos.LayoutDTO;
import com.appsmith.server.dtos.UpdateMultiplePageLayoutDTO;
import net.minidev.json.JSONObject;
import reactor.core.publisher.Mono;

public interface UpdateLayoutServiceCE {
    Mono<LayoutDTO> updateLayout(String pageId, String applicationId, String layoutId, Layout layout);

    Mono<LayoutDTO> updateLayout(
            String defaultPageId, String defaultApplicationId, String layoutId, Layout layout, String branchName);

    Mono<Integer> updateMultipleLayouts(
            String defaultApplicationId, String branchName, UpdateMultiplePageLayoutDTO updateMultiplePageLayoutDTO);

    JSONObject unescapeMongoSpecialCharacters(Layout layout);

    Mono<String> updatePageLayoutsByPageId(String pageId);
}
