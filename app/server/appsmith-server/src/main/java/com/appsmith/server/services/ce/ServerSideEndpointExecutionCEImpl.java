package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.ServerSideExecutionRequestDTO;
import com.appsmith.server.dtos.ServerSideExecutionResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.NewActionService;
import lombok.RequiredArgsConstructor;
import org.pf4j.util.StringUtils;
import reactor.core.publisher.Mono;

import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.ACTION_ID;

@RequiredArgsConstructor
public class ServerSideEndpointExecutionCEImpl implements ServerSideEndpointExecutionCE {

    private final NewActionService actionService;

    private static final String SERVER_EXECUTION_URL_FORMAT = "%s/api/v1/server-execution/%s";

    enum MODE {
        VIEW,
        EDIT
    }

    @Override
    public Mono<ServerSideExecutionResponseDTO> generateServerExecutionUrl(ServerSideExecutionRequestDTO requestDTO) {
        final String collectionId = requestDTO.getCollectionId();
        final String actionId = requestDTO.getActionId();
        if (StringUtils.isNullOrEmpty(collectionId) || StringUtils.isNullOrEmpty(actionId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ACTION_ID));
        }
        Mono<NewAction> actionMono = actionService
                .findById(actionId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId)));

        return actionMono.flatMap(newAction -> {
            if (!collectionId.equals(newAction.getUnpublishedAction().getCollectionId())) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.COLLECTION_ID));
            }

            ActionDTO unpublishedAction = newAction.getUnpublishedAction();
            String remoteExecutionUrl = null;
            if (!Boolean.TRUE.equals(requestDTO.getRevoke())) {
                remoteExecutionUrl = getRemoteUrl(requestDTO.getBaseUrl(), actionId);
                unpublishedAction.setServerSideExecution(true);
            }
            unpublishedAction.setServerSideExecutionEndpoint(remoteExecutionUrl);

            ServerSideExecutionResponseDTO executionResponse = new ServerSideExecutionResponseDTO();
            executionResponse.setServerSideExecutionEndpoint(remoteExecutionUrl);
            executionResponse.setActionId(actionId);
            executionResponse.setActionCollectionId(collectionId);

            return actionService.save(newAction).thenReturn(executionResponse);
        });
    }

    @Override
    public Mono<Object> runAction(String actionId, String mode, Map<String, Object> params) {
        if (StringUtils.isNullOrEmpty(actionId)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ACTION_ID));
        }
        Mono<NewAction> actionMono = actionService
                .findById(actionId)
                .switchIfEmpty(
                        Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.ACTION, actionId)));

        return actionMono.flatMap(jsAction -> {
            ActionDTO actionDTO =
                    MODE.EDIT.name().equals(mode) ? jsAction.getUnpublishedAction() : jsAction.getPublishedAction();

            if (!isValidActionForRemoteExecution(actionDTO)) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, ACTION_ID));
            }
            String body = actionDTO.getActionConfiguration().getBody();
            String remoteExecutionUrl = actionDTO.getServerSideExecutionEndpoint();
            // TODO call node server to get the response
            return this.getRemoteResponse(body, params, remoteExecutionUrl);
        });
    }

    private static String getRemoteUrl(String baseUrl, String actionId) {
        return String.format(SERVER_EXECUTION_URL_FORMAT, baseUrl, actionId);
    }

    private static boolean isValidActionForRemoteExecution(ActionDTO actionDTO) {
        return !(actionDTO == null
                || StringUtils.isNullOrEmpty(actionDTO.getCollectionId())
                || StringUtils.isNullOrEmpty(actionDTO.getServerSideExecutionEndpoint())
                || actionDTO.getActionConfiguration() == null);
    }

    private Mono<Object> getRemoteResponse(String body, Map<String, Object> params, String remoteUrl) {
        return null;
    }
}
