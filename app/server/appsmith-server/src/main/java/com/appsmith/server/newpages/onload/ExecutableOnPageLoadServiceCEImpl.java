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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class ExecutableOnPageLoadServiceCEImpl implements ExecutableOnLoadServiceCE<NewPage> {

    private final NewActionService newActionService;
    private final NewPageService newPageService;
    private final ApplicationService applicationService;

    private final ActionPermission actionPermission;
    private final PagePermission pagePermission;

    @Override
    public Flux<Executable> getAllExecutablesByCreatorIdFlux(String creatorId) {
        return newActionService
                .findByPageIdAndViewMode(creatorId, false, actionPermission.getEditPermission())
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(actionDTO -> (Executable) actionDTO)
                .cache();
    }

    @Override
    public Mono<Executable> fillSelfReferencingPaths(Executable executable) {
        return newActionService
                .fillSelfReferencingDataPaths((ActionDTO) executable)
                .map(actionDTO -> actionDTO);
    }

    @Override
    public Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(String creatorId) {
        return newActionService
                .findUnpublishedOnLoadActionsExplicitSetByUserInPage(creatorId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false));
    }

    @Override
    public Mono<Executable> updateUnpublishedExecutable(String id, Executable executable) {
        return newActionService
                .updateUnpublishedAction(id, (ActionDTO) executable)
                .map(updated -> updated);
    }

    @Override
    public Mono<Layout> findAndUpdateLayout(String creatorId, String layoutId, Layout layout) {
        Mono<PageDTO> pageDTOMono = newPageService
                .findByIdAndLayoutsId(creatorId, layoutId, pagePermission.getEditPermission(), false)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID,
                        creatorId + ", " + layoutId)));

        return pageDTOMono
                .flatMap(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    // Because the findByIdAndLayoutsId call returned non-empty result, we are guaranteed to find the
                    // layoutId here.
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            // Now that all the on load actions have been computed, set the vertices, edges, actions in
                            // DSL in the layout for re-use to avoid computing DAG unnecessarily.

                            BeanUtils.copyProperties(layout, storedLayout);
                            storedLayout.setId(layoutId);

                            break;
                        }
                    }
                    page.setLayouts(layoutList);
                    return applicationService
                            .saveLastEditInformation(page.getApplicationId())
                            .then(newPageService.saveUnpublishedPage(page));
                })
                .flatMap(page -> {
                    List<Layout> layoutList = page.getLayouts();
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            return Mono.just(storedLayout);
                        }
                    }
                    return Mono.empty();
                });
    }
}
