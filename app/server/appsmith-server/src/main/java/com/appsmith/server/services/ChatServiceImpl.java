package com.appsmith.server.services;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.dtos.ChatGenerationDTO;
import com.appsmith.server.dtos.ChatGenerationRequestDTO;
import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.dtos.LicenseValidationRequestDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.enums.ChatGenerationType;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import com.appsmith.server.solutions.LicenseAPIManager;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.codec.DecodingException;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {
    private final CloudServicesConfig cloudServicesConfig;
    private final TenantService tenantService;
    private final ConfigService configService;
    private final SessionUserService sessionUserService;
    private final LicenseAPIManager licenseAPIManager;
    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final DatasourceStructureSolution datasourceStructureSolution;

    @Override
    public Mono<ChatGenerationResponseDTO> generateCode(ChatGenerationDTO chatGenerationDTO, ChatGenerationType type) {
        Mono<LicenseValidationRequestDTO> requestDTOMono =
                tenantService.getDefaultTenant().flatMap(licenseAPIManager::populateLicenseValidationRequest);

        // TODO: Change this to get current tenant when multitenancy is introduced
        return Mono.zip(configService.getInstanceId(), sessionUserService.getCurrentUser(), requestDTOMono)
                .flatMap(tuple -> {
                    String instanceId = tuple.getT1();
                    String userId = tuple.getT2().getId();
                    LicenseValidationRequestDTO licenseValidationRequestDTO = tuple.getT3();
                    ChatGenerationRequestDTO chatGenerationRequestDTO = new ChatGenerationRequestDTO(
                            chatGenerationDTO, userId, instanceId, licenseValidationRequestDTO);
                    return populateRequestMeta(chatGenerationDTO, type).flatMap(ignored -> WebClientUtils.create(
                                    cloudServicesConfig.getBaseUrl() + "/api/v1/chat/chat-generation")
                            .post()
                            .uri(builder -> builder.queryParam("type", type).build())
                            .body(BodyInserters.fromValue(chatGenerationRequestDTO))
                            .exchangeToMono(clientResponse -> {
                                if (clientResponse.statusCode().is2xxSuccessful()) {
                                    return clientResponse.bodyToMono(
                                            new ParameterizedTypeReference<
                                                    ResponseDTO<ChatGenerationResponseDTO>>() {});
                                } else {
                                    return clientResponse.createError();
                                }
                            })
                            .map(ResponseDTO::getData)
                            .onErrorMap(WebClientResponseException.class, e -> {
                                ResponseDTO<ChatGenerationResponseDTO> responseDTO;
                                try {
                                    responseDTO = e.getResponseBodyAs(new ParameterizedTypeReference<>() {});
                                } catch (DecodingException | IllegalStateException e2) {
                                    return e;
                                }
                                log.debug(
                                        "Error reported while generating code for request {}, {}",
                                        chatGenerationRequestDTO.getRequest(),
                                        responseDTO.getResponseMeta().getError().getMessage());
                                if (responseDTO != null
                                        && responseDTO.getResponseMeta() != null
                                        && responseDTO.getResponseMeta().getError() != null) {
                                    return new AppsmithException(
                                            AppsmithError.APPSMITH_AI_ERROR,
                                            responseDTO
                                                    .getResponseMeta()
                                                    .getError()
                                                    .getMessage());
                                }
                                return e;
                            })
                            .onErrorMap(
                                    // Only map errors if we haven't already wrapped them into an AppsmithException
                                    e -> !(e instanceof AppsmithException),
                                    e -> new AppsmithException(AppsmithError.CLOUD_SERVICES_ERROR, e.getMessage())));
                });
    }

    private Mono<ChatGenerationDTO> populateRequestMeta(ChatGenerationDTO chatGenerationDTO, ChatGenerationType type) {
        if (ChatGenerationType.SQL.equals(type)) {
            String datasourceId = chatGenerationDTO.getMeta().getDatasourceId();
            if (datasourceId != null) {

                Mono<Datasource> datasourceMono = datasourceService
                        .findById(datasourceId)
                        .zipWhen(
                                datasource -> pluginService.findById(datasource.getPluginId()),
                                ((datasource, plugin) -> {
                                    datasource.setPluginName(plugin.getName());
                                    return datasource;
                                }));

                return Mono.zip(datasourceMono, datasourceStructureSolution.getStructure(datasourceId, false, null))
                        .map(tuple2 -> {
                            Datasource datasource = tuple2.getT1();
                            DatasourceStructure structure = tuple2.getT2();
                            ChatGenerationDTO.ChatGenerationDatasourceStructure metaStructure =
                                    new ChatGenerationDTO.ChatGenerationDatasourceStructure();
                            metaStructure.setPluginName(datasource.getPluginName());
                            metaStructure.setDatasourceName(datasource.getName());
                            metaStructure.setStructure(structure);
                            chatGenerationDTO.getMeta().setDatasourceStructure(metaStructure);
                            return chatGenerationDTO;
                        });
            }
        }
        return Mono.just(chatGenerationDTO);
    }
}
