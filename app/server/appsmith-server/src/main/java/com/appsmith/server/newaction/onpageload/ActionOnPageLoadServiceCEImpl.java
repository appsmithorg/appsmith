package com.appsmith.server.newaction.onpageload;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Executable;
import com.appsmith.server.newaction.base.NewActionService;
import com.appsmith.server.onpageload.executables.ExecutableOnPageLoadServiceCE;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
@Service
public class ActionOnPageLoadServiceCEImpl implements ExecutableOnPageLoadServiceCE<ActionDTO> {

    private final NewActionService newActionService;
    private final ActionPermission actionPermission;

    @Override
    public Flux<Executable> getAllExecutablesByPageIdFlux(String pageId) {
        return newActionService
                .findByPageIdAndViewMode(pageId, false, actionPermission.getEditPermission())
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false))
                .map(actionDTO -> (Executable) actionDTO)
                .cache();
    }

    @Override
    public Mono<Executable> fillSelfReferencingPaths(ActionDTO executable) {
        return newActionService.fillSelfReferencingDataPaths(executable).map(actionDTO -> actionDTO);
    }

    @Override
    public Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(String pageId) {
        return newActionService
                .findUnpublishedOnLoadActionsExplicitSetByUserInPage(pageId)
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false));
    }

    @Override
    public Mono<Executable> updateUnpublishedExecutable(String id, Executable executable) {
        return newActionService
                .updateUnpublishedAction(id, (ActionDTO) executable)
                .map(updated -> updated);
    }
}
