package com.appsmith.server.onload.internal;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.external.dtos.LayoutExecutableUpdateDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Executable;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.ExecutableDependencyEdge;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import reactor.core.publisher.Mono;

import java.time.Instant;
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

    /**
     * Saves the layout only if the creator did not change since {@code expectedUpdatedAt}.
     *
     * <p>This default supports no revision check:
     * <ul>
     *   <li>{@code expectedUpdatedAt} is null: saves the layout without a check.
     *   <li>{@code expectedUpdatedAt} is set: fails with {@code INVALID_PARAMETER}.
     * </ul>
     */
    default Mono<Layout> findAndUpdateLayout(
            String creatorId,
            CreatorContextType creatorType,
            String layoutId,
            Layout layout,
            Instant expectedUpdatedAt) {
        if (expectedUpdatedAt == null) {
            return findAndUpdateLayout(creatorId, creatorType, layoutId, layout);
        }
        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.EXPECTED_REVISION));
    }
}
