package com.appsmith.server.newactions.publish;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.PackagePublishingMetaDTO;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.publish.packages.publishable.PackagePublishableService;
import com.appsmith.server.solutions.ActionPermission;
import org.bson.types.ObjectId;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class NewActionPackagePublishableServiceImpl implements PackagePublishableService<NewAction> {
    private final ActionPermission actionPermission;
    private final NewActionService newActionService;

    public NewActionPackagePublishableServiceImpl(
            ActionPermission actionPermission, NewActionService newActionService) {
        this.actionPermission = actionPermission;
        this.newActionService = newActionService;
    }

    @Override
    public Mono<List<NewAction>> publishEntities(PackagePublishingMetaDTO publishingMetaDTO) {

        return Flux.fromIterable(publishingMetaDTO
                        .getOriginModuleIdToPublishedModuleMap()
                        .keySet())
                .flatMap(sourceModuleId -> newActionService.findAllActionsByContextIdAndContextTypeAndViewMode(
                        sourceModuleId, CreatorContextType.MODULE, actionPermission.getEditPermission(), false, false))
                .map(sourceAction -> getNewAction(publishingMetaDTO, sourceAction))
                .collectList()
                .flatMap(publishableActions ->
                        newActionService.saveAll(publishableActions).collectList());
    }

    @NotNull private NewAction getNewAction(PackagePublishingMetaDTO publishingMetaDTO, NewAction sourceNewAction) {
        NewAction toBePublishedNewAction = new NewAction();
        AppsmithBeanUtils.copyNestedNonNullProperties(sourceNewAction, toBePublishedNewAction);
        toBePublishedNewAction.setId(new ObjectId().toString());
        toBePublishedNewAction.setOriginActionId(sourceNewAction.getId());
        ActionDTO sourceUnpublishedAction = sourceNewAction.getUnpublishedAction();
        toBePublishedNewAction.setPublishedAction(sourceUnpublishedAction);
        toBePublishedNewAction.setUnpublishedAction(new ActionDTO());
        toBePublishedNewAction
                .getPublishedAction()
                .setModuleId(publishingMetaDTO
                        .getOriginModuleIdToPublishedModuleMap()
                        .get(sourceUnpublishedAction.getModuleId())
                        .getId());

        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setActionId(toBePublishedNewAction.getId());
        toBePublishedNewAction.setDefaultResources(defaultResources);
        sourceUnpublishedAction.setDefaultResources(defaultResources);

        return toBePublishedNewAction;
    }
}
