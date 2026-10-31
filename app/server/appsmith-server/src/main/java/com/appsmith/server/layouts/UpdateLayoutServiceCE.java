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

    Mono<LayoutDTO> updateLayout(
            String pageId, String applicationId, String layoutId, Layout layout, CreatorContextType contextType);

    /**
     * Updates a page layout, optionally only if the page did not change since a read.
     *
     * <ul>
     *   <li>{@code expectedRevision} is null: same as {@link #updateLayout(String, String, String, Layout)}.
     *   <li>{@code expectedRevision} is not a number of epoch milliseconds: fails with {@code INVALID_PARAMETER}.
     *   <li>The page changed after that revision: fails with {@code STALE_LAYOUT_UPDATE} (HTTP 409).
     *   <li>Saved: the result's `revision` is the new page revision.
     * </ul>
     */
    Mono<LayoutDTO> updateLayoutWithRevision(
            String pageId, String applicationId, String layoutId, Layout layout, String expectedRevision);

    Mono<Integer> updateMultipleLayouts(
            String defaultApplicationId, UpdateMultiplePageLayoutDTO updateMultiplePageLayoutDTO);

    JSONObject unescapeMongoSpecialCharacters(Layout layout);

    Mono<String> updatePageLayoutsByPageId(String pageId);

    Mono<List<Set<DslExecutableDTO>>> getOnPageLoadActions(
            String creatorId, String layoutId, Layout layout, Integer evaluatedVersion, CreatorContextType creatorType);

    Mono<String> updateLayoutByContextTypeAndContextId(CreatorContextType contextType, String contextId);
}
