package com.appsmith.server.services;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.ChatGenerationDTO;
import com.appsmith.server.dtos.ChatGenerationRequestDTO;
import com.appsmith.server.dtos.ChatGenerationResponseDTO;
import com.appsmith.server.dtos.LicenseValidationRequestDTO;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.enums.ChatGenerationType;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final FeatureFlagService featureFlagService;
    private final CloudServicesConfig cloudServicesConfig;
    private final TenantService tenantService;
    private final ConfigService configService;
    private final SessionUserService sessionUserService;

    @Override
    public Mono<ChatGenerationResponseDTO> generateCode(ChatGenerationDTO chatGenerationDTO, ChatGenerationType type) {
        Mono<Boolean> featureFlagMono = this.featureFlagService.check(FeatureFlagEnum.CHAT_AI)
                .filter(isAllowed -> isAllowed)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)));

        // TODO: Change this to get current tenant when multitenancy is introduced
        return Mono.zip(
                        featureFlagMono,
                        configService.getInstanceId(),
                        sessionUserService.getCurrentUser(),
                        tenantService.getDefaultTenant())
                .flatMap(tuple -> {
                    Tenant tenant = tuple.getT4();
                    TenantConfiguration.License license = tenant.getTenantConfiguration().getLicense();
                    LicenseValidationRequestDTO licenseValidationRequestDTO = new LicenseValidationRequestDTO();
                    licenseValidationRequestDTO.setLicenseKey(license.getKey());
                    licenseValidationRequestDTO.setInstanceId(tenant.getInstanceId());
                    licenseValidationRequestDTO.setTenantId(tenant.getId());
                    String instanceId = tuple.getT2();
                    String userId = tuple.getT3().getId();
                    ChatGenerationRequestDTO chatGenerationRequestDTO =
                            new ChatGenerationRequestDTO(chatGenerationDTO, userId, instanceId, licenseValidationRequestDTO);
                    return WebClientUtils
                            .create(cloudServicesConfig.getBaseUrl() + "/api/v1/chat/chat-generation")
                            .post()
                            .uri(builder -> builder.queryParam("type", type).build())
                            .body(BodyInserters.fromValue(chatGenerationRequestDTO))
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<ResponseDTO<ChatGenerationResponseDTO>>() {
                            })
                            .onErrorMap(e -> {
                                return new AppsmithException(
                                        AppsmithError.CLOUD_SERVICES_ERROR,
                                        "Unable to connect to cloud-services with error: " + e);
                            })
                            .map(ResponseDTO::getData);
                });
    }
}
