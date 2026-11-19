package com.appsmith.server.newpages.onload;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Executable;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.onload.executables.ExecutableOnLoadServiceCE;
import com.appsmith.server.solutions.ActionPermission;
import com.appsmith.server.solutions.PagePermission;
import io.micrometer.observation.ObservationRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import reactor.core.observability.micrometer.Micrometer;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.List;

import static com.appsmith.external.constants.spans.ActionSpan.FILL_SELF_REFERENCING_PATHS_ACTION;
import static com.appsmith.external.constants.spans.ApplicationSpan.APPLICATION_SAVE_LAST_EDIT_INFO_SPAN;
import static com.appsmith.external.constants.spans.PageSpan.GET_PAGE_BY_ID_AND_LAYOUTS_ID;

@Slf4j
@RequiredArgsConstructor
@Service
public class ExecutableOnPageLoadServiceCEImpl implements ExecutableOnLoadServiceCE<NewPage> {

    private final NewActionService newActionService;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;

    private final ActionPermission actionPermission;
    private final PagePermission pagePermission;
    private final ObservationRegistry observationRegistry;

    @Override
    public Flux<Executable> getAllExecutablesByCreatorIdFlux(String creatorId) {
        return newActionService
                .findByPageIdAndViewMode(creatorId, false, actionPermission.getEditPermission())
                .map(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(actionDTO -> (Executable) actionDTO)
                .cache();
    }

    @Override
    public Mono<Executable> fillSelfReferencingPaths(Executable executable) {
        return newActionService
                .fillSelfReferencingDataPaths((ActionDTO) executable)
                .name(FILL_SELF_REFERENCING_PATHS_ACTION)
                .tap(Micrometer.observation(observationRegistry))
                .map(actionDTO -> actionDTO);
    }

    @Override
    public Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(String creatorId) {
        return newActionService
                .findUnpublishedOnLoadActionsExplicitSetByUserInPage(creatorId)
                .map(newAction -> newActionService.generateActionByViewMode(newAction, false));
    }

    @Override
    public Mono<Executable> updateUnpublishedExecutable(String id, Executable executable) {
        return newActionService
                .updateUnpublishedAction(id, (ActionDTO) executable)
                .map(updated -> updated);
    }

    @Override
    public Mono<Layout> findAndUpdateLayout(String creatorId, String layoutId, Layout layout) {
        return findEditablePage(creatorId, layoutId)
                .flatMap(page -> {
                    copyLayoutIntoPage(page.getLayouts(), layoutId, layout);
                    return applicationService
                            .saveLastEditInformation(page.getApplicationId())
                            .name(APPLICATION_SAVE_LAST_EDIT_INFO_SPAN)
                            .tap(Micrometer.observation(observationRegistry))
                            .then(newPageService.saveUnpublishedPage(page));
                })
                .flatMap(page -> Mono.justOrEmpty(findLayout(page.getLayouts(), layoutId)));
    }

    /**
     * Saves the layout only if the page did not change since {@code expectedUpdatedAt}.
     *
     * <ul>
     *   <li>{@code expectedUpdatedAt} is null: same as the unconditional save.
     *   <li>Page changed: fails with {@code STALE_LAYOUT_UPDATE} and writes nothing.
     *   <li>Saved: the returned layout carries the new page revision.
     * </ul>
     * The application's last-edit information is updated only after the page write succeeds.
     */
    @Override
    public Mono<Layout> findAndUpdateLayout(
            String creatorId, String layoutId, Layout layout, Instant expectedUpdatedAt) {
        if (expectedUpdatedAt == null) {
            return findAndUpdateLayout(creatorId, layoutId, layout);
        }

        return findEditablePage(creatorId, layoutId)
                .flatMap(page -> {
                    copyLayoutIntoPage(page.getLayouts(), layoutId, layout);
                    return newPageService
                            .saveUnpublishedPageIfUnchanged(page, expectedUpdatedAt)
                            .flatMap(savedPage -> applicationService
                                    .saveLastEditInformation(page.getApplicationId())
                                    .name(APPLICATION_SAVE_LAST_EDIT_INFO_SPAN)
                                    .tap(Micrometer.observation(observationRegistry))
                                    .thenReturn(savedPage));
                })
                .flatMap(savedPage -> {
                    Layout savedLayout =
                            findLayout(savedPage.getUnpublishedPage().getLayouts(), layoutId);
                    if (savedLayout == null) {
                        return Mono.empty();
                    }
                    savedLayout.setRevision(
                            String.valueOf(savedPage.getUpdatedAt().toEpochMilli()));
                    return Mono.just(savedLayout);
                });
    }

    // Reads the unpublished page that holds the layout, with edit permission. Fails with ACL_NO_RESOURCE_FOUND when
    // the page or layout is missing or the user cannot edit it.
    private Mono<PageDTO> findEditablePage(String creatorId, String layoutId) {
        return newPageService
                .findByIdAndLayoutsId(creatorId, layoutId, pagePermission.getEditPermission(), false)
                .name(GET_PAGE_BY_ID_AND_LAYOUTS_ID)
                .tap(Micrometer.observation(observationRegistry))
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID,
                        creatorId + ", " + layoutId)));
    }

    // Copies the computed layout (DSL, on-load actions, and the rest) over the stored layout with the same id. The
    // lookup matched this layoutId, so the layout is in the list.
    private static void copyLayoutIntoPage(List<Layout> layouts, String layoutId, Layout layout) {
        Layout storedLayout = findLayout(layouts, layoutId);
        if (storedLayout != null) {
            BeanUtils.copyProperties(layout, storedLayout);
            storedLayout.setId(layoutId);
        }
    }

    private static Layout findLayout(List<Layout> layouts, String layoutId) {
        for (Layout storedLayout : layouts) {
            if (storedLayout.getId().equals(layoutId)) {
                return storedLayout;
            }
        }
        return null;
    }
}
