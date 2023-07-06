package com.appsmith.server.services;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.ApiKeyRequestDto;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@AllArgsConstructor
public class ProvisionServiceImpl implements ProvisionService {
    private final ApiKeyService apiKeyService;

    @Override
    public Mono<String> generateProvisionToken() {
        ApiKeyRequestDto apiKeyRequestDto =
                ApiKeyRequestDto.builder().email(FieldName.PROVISIONING_USER).build();
        return apiKeyService.generateApiKey(apiKeyRequestDto);
    }
}
