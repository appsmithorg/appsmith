package com.appsmith.server.newactions.publish;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.PublishingMetaDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.publish.packages.publishable.PackagePublishableService;
import com.appsmith.server.solutions.ActionPermission;
import org.bson.types.ObjectId;
import org.jetbrains.annotations.NotNull;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class NewActionPublishableServiceImpl implements PackagePublishableService<NewAction> {
    private final ActionPermission actionPermission;
    private final NewActionService newActionService;

    public NewActionPublishableServiceImpl(ActionPermission actionPermission, NewActionService newActionService) {
        this.actionPermission = actionPermission;
        this.newActionService = newActionService;
    }

    @Override
    public Mono<List<NewAction>> getPublishableEntities(PublishingMetaDTO publishingMetaDTO) {

        return Flux.fromIterable(
                        publishingMetaDTO.getOldModuleIdToNewModuleIdMap().keySet())
                .flatMap(sourceModuleId -> newActionService.findAllActionsByContextIdAndContextTypeAndViewMode(
                        sourceModuleId, CreatorContextType.MODULE, actionPermission.getEditPermission(), false, false))
                .flatMap(sourceAction -> Mono.just(getNewAction(publishingMetaDTO, sourceAction)))
                .collectList()
                .flatMap(publicPrivateActions ->
                        newActionService.saveAll(publicPrivateActions).collectList());
    }

    @NotNull private NewAction getNewAction(PublishingMetaDTO publishingMetaDTO, NewAction sourceNewAction) {
        NewAction toBePublishedNewAction = new NewAction();
        AppsmithBeanUtils.copyNestedNonNullProperties(sourceNewAction, toBePublishedNewAction);
        toBePublishedNewAction.setId(new ObjectId().toString());
        toBePublishedNewAction.setPublishedAction(sourceNewAction.getUnpublishedAction());
        toBePublishedNewAction.setUnpublishedAction(new ActionDTO());
        toBePublishedNewAction
                .getPublishedAction()
                .setModuleId(publishingMetaDTO
                        .getOldModuleIdToNewModuleIdMap()
                        .get(sourceNewAction.getUnpublishedAction().getModuleId()));

        DefaultResources defaultResources = new DefaultResources();
        defaultResources.setActionId(toBePublishedNewAction.getId());
        toBePublishedNewAction.setDefaultResources(defaultResources);

        // The published version of newAction should only be executable
        Set<Policy> updatedPolicies = sourceNewAction.getPolicies().stream()
                .filter(policy -> policy.getPermission()
                        .equals(actionPermission.getExecutePermission().getValue()))
                .collect(Collectors.toSet());
        toBePublishedNewAction.setPolicies(updatedPolicies);

        return toBePublishedNewAction;
    }

    @Override
    public Mono<Void> updatePublishableEntities(PublishingMetaDTO publishingMetaDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
