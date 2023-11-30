package com.appsmith.server.modules.onload;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Executable;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Module;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.onload.executables.ExecutableOnLoadService;
import com.appsmith.server.packages.crud.CrudPackageService;
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
public class ExecutableOnModuleLoadServiceImpl implements ExecutableOnLoadService<Module> {
    private final NewActionService newActionService;

    private final ActionPermission actionPermission;
    private final PagePermission pagePermission;
    private final CrudModuleService moduleService;
    private final CrudPackageService packageService;

    @Override
    public Flux<Executable> getAllExecutablesByCreatorIdFlux(String creatorId) {
        return newActionService
                .findAllActionsByContextIdAndContextTypeAndViewMode(
                        creatorId, CreatorContextType.MODULE, actionPermission.getEditPermission(), false, true)
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

    // TODO : Switch this to creator context type kind of usage
    @Override
    public Flux<Executable> getUnpublishedOnLoadExecutablesExplicitSetByUserInPageFlux(String creatorId) {
        return newActionService
                .findUnpublishedOnLoadActionsExplicitSetByUserInModule(creatorId)
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
        Mono<ModuleDTO> moduleDTOMono = moduleService
                .findByIdAndLayoutsId(creatorId, layoutId, pagePermission.getEditPermission(), ResourceModes.EDIT)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.PAGE_ID + " or " + FieldName.LAYOUT_ID,
                        creatorId + ", " + layoutId)));

        return moduleDTOMono
                .flatMap(moduleDTO -> {
                    List<Layout> layoutList = moduleDTO.getLayouts();
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
                    moduleDTO.setLayouts(layoutList);
                    // TODO: Figure out why save last edit information is required
                    //                    return packageService
                    //                            .saveLastEditInformation(moduleDTO.getPackageId())
                    //                            .then(moduleService.updateModule(moduleDTO, moduleDTO.getId()));
                    return moduleService.updateModule(moduleDTO, moduleDTO.getId());
                })
                .flatMap(moduleDTO -> {
                    List<Layout> layoutList = moduleDTO.getLayouts();
                    for (Layout storedLayout : layoutList) {
                        if (storedLayout.getId().equals(layoutId)) {
                            return Mono.just(storedLayout);
                        }
                    }
                    return Mono.empty();
                });
    }
}
