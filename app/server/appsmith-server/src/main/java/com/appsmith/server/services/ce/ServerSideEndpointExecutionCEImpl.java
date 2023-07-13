package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ServerSideExecutionMetadataDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.NewActionService;
import lombok.RequiredArgsConstructor;
import org.pf4j.util.StringUtils;
import reactor.core.publisher.Mono;

@RequiredArgsConstructor
public class ServerSideEndpointExecutionCEImpl implements ServerSideEndpointExecutionCE {

    private final NewActionService actionService;

    @Override
    public Mono<ServerSideExecutionMetadataDTO> generateServerExecutionUrl(String collectionId, String actionId) {
        if (StringUtils.isNullOrEmpty(collectionId) || StringUtils.isNullOrEmpty(actionId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.ACTION_ID));
        }
        Mono<NewAction> actionMono = actionService
                .findById(actionId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId)));

        return actionMono.flatMap(newAction -> {
            String remoteExecutionUrl = getRemoteUrl(collectionId, actionId);
            ServerSideExecutionMetadataDTO dto = new ServerSideExecutionMetadataDTO();
            dto.setServerExecutionEndpoint(remoteExecutionUrl);
            dto.setActionId(actionId);
            dto.setActionCollectionId(collectionId);

            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
            unpublishedAction.setServerJSExecutionEndpoint(remoteExecutionUrl);
            unpublishedAction.setServerSideExecution(true);
            if (!collectionId.equals(newAction.getUnpublishedAction().getCollectionId())) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.COLLECTION_ID));
            }
            return actionService.save(newAction).thenReturn(dto);
        });
    }

    private static String getRemoteUrl(String actionCollection, String actionId) {
        return "{base_url}/server-execution/{actionCollectionId}/{actionId}";
    }
}
