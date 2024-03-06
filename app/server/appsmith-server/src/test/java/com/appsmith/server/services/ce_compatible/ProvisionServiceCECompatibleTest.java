package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.dtos.DisconnectProvisioningDto;
import com.appsmith.server.dtos.ProvisionStatusDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.ProvisionService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

@Slf4j
@ExtendWith(SpringExtension.class)
@SpringBootTest
@AutoConfigureWebTestClient
class ProvisionServiceCECompatibleTest {

    @MockBean
    FeatureFlagService featureFlagService;

    @Autowired
    ProvisionService provisionService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @BeforeEach
    public void beforeSetup() {
        Mockito.when(featureFlagService.check(Mockito.eq(FeatureFlagEnum.license_scim_enabled)))
                .thenReturn(Mono.just(Boolean.FALSE));
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testGenerateProvisionToken() {
        Mono<String> generateProvisionTokenMono = provisionService.generateProvisionToken();
        StepVerifier.create(generateProvisionTokenMono)
                .expectErrorMatches(exception -> exception instanceof AppsmithException
                        && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void teatGetProvisionStatus() {
        Mono<ProvisionStatusDTO> provisionStatusMono = provisionService.getProvisionStatus();
        StepVerifier.create(provisionStatusMono)
                .expectErrorMatches(exception -> exception instanceof AppsmithException
                        && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();
    }

    @Test
    @WithUserDetails(value = FieldName.PROVISIONING_USER)
    void testArchiveProvisionToken() {
        Mono<Boolean> archiveProvisionTokenMono = provisionService.archiveProvisionToken();
        StepVerifier.create(archiveProvisionTokenMono)
                .expectErrorMatches(exception -> exception instanceof AppsmithException
                        && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();
    }

    @Test
    void disconnectProvisioning() {
        DisconnectProvisioningDto disconnectProvisioningDto = DisconnectProvisioningDto.builder()
                .keepAllProvisionedResources(false)
                .build();
        Mono<Boolean> disconnectProvisioningMono = provisionService.disconnectProvisioning(disconnectProvisioningDto);
        StepVerifier.create(disconnectProvisioningMono)
                .expectErrorMatches(exception -> exception instanceof AppsmithException
                        && exception.getMessage().equals(AppsmithError.UNSUPPORTED_OPERATION.getMessage()))
                .verify();
    }
}
