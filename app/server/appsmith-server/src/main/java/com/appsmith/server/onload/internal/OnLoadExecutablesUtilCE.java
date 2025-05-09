package com.appsmith.server.onload.internal;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Executable;
import com.appsmith.server.domains.ExecutableDependencyEdge;
import com.appsmith.server.domains.Layout;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface OnLoadExecutablesUtilCE {

    Mono<List<Set<DslExecutableDTO>>> findAllOnLoadExecutables(
            String creatorId,
            Integer evaluatedVersion,
            Set<String> widgetNames,
            Set<ExecutableDependencyEdge> edges,
            Map<String, Set<String>> widgetDynamicBindingsMap,
            List<Executable> flatPageLoadExecutables,
            Set<String> executablesUsedInDSL,
            CreatorContextType creatorType);

    /**
     * !!!WARNING!!! This function edits the parameters executableUpdatesRef and messagesRef which are eventually returned back to
     * the caller with the updates values.
     *
     * @param onLoadExecutables : All the actions which have been found to be on page load
     * @param creatorId
     * @param executableUpdatesRef : Empty array list which would be set in this function with all the page actions whose
     *                      execute on load setting has changed (whether flipped from true to false, or vice versa)
     * @param messagesRef      : Empty array list which would be set in this function with all the messagesRef that should be
     *                      displayed to the developer user communicating the action runBehaviour changes.
     * @return
     */
    Mono<Boolean> updateExecutablesRunBehaviour(
            List<Executable> onLoadExecutables,
            String creatorId,
            List<LayoutExecutableUpdateDTO> executableUpdatesRef,
            List<String> messagesRef,
            CreatorContextType creatorType);

    Mono<Layout> findAndUpdateLayout(String creatorId, CreatorContextType creatorType, String layoutId, Layout layout);
}
