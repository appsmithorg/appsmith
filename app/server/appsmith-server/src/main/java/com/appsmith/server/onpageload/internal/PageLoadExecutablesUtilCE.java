package com.appsmith.server.onpageload.internal;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.models.Executable;
import com.appsmith.server.domains.ExecutableDependencyEdge;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Set;

public interface PageLoadExecutablesUtilCE {

    Mono<List<Set<DslExecutableDTO>>> findAllOnLoadExecutables(
            String pageId,
            Integer evaluatedVersion,
            Set<String> widgetNames,
            Set<ExecutableDependencyEdge> edges,
            Map<String, Set<String>> widgetDynamicBindingsMap,
            List<Executable> flatPageLoadExecutables,
            Set<String> executablesUsedInDSL);

    /**
     * !!!WARNING!!! This function edits the parameters executableUpdatesRef and messagesRef which are eventually returned back to
     * the caller with the updates values.
     *
     * @param onLoadExecutables : All the actions which have been found to be on page load
     * @param pageId
     * @param executableUpdatesRef : Empty array list which would be set in this function with all the page actions whose
     *                      execute on load setting has changed (whether flipped from true to false, or vice versa)
     * @param messagesRef      : Empty array list which would be set in this function with all the messagesRef that should be
     *                      displayed to the developer user communicating the action executeOnLoad changes.
     * @return
     */
    Mono<Boolean> updateExecutablesExecuteOnLoad(
            List<Executable> onLoadExecutables,
            String pageId,
            List<LayoutExecutableUpdateDTO> executableUpdatesRef,
            List<String> messagesRef);
}
