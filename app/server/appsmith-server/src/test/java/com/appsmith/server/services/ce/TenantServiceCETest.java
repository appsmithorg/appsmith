package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.SessionUserService;
import lombok.RequiredArgsConstructor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.UUID;

import static com.appsmith.server.constants.ce.FieldNameCE.TENANT_ID;
import static org.assertj.core.api.Assertions.assertThat;

@RequiredArgsConstructor
@SpringBootTest
@DirtiesContext
class TenantServiceCETest {

    @Autowired
    TenantServiceCE tenantService;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @BeforeEach
    void setup() {
        // Make api_user super-user to test tenant admin functionality
        User api_user = userRepository.findByEmail("api_user").block();
        // Todo change this to tenant admin once we introduce multitenancy
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getDefaultTenantId_withoutPermission_success() {
        Mono<String> defaultTenantIdMono = tenantService.getDefaultTenantId();
        StepVerifier
                .create(defaultTenantIdMono)
                .assertNext(defaultTenantId -> assertThat(defaultTenantId).isNotEmpty())
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void getTenantConfiguration_loggedInUser_success() {
        Mono<Tenant> tenantMono = tenantService.getTenantConfiguration();
        Mono<String> tenantIdMono = sessionUserService.getCurrentUser().map(User::getTenantId);
        StepVerifier
                .create(tenantMono.zipWith(tenantIdMono))
                .assertNext(tuple -> {
                    Tenant tenant = tuple.getT1();
                    String tenantId = tuple.getT2();
                    assertThat(tenant.getId()).isEqualTo(tenantId);
                    assertThat(tenant.getInstanceId()).isNotEmpty();
                })
                .verifyComplete();
    }

    @Test
    public void updateTenant_invalidTenantId_throwInvalidParameterException() {
        Mono<Tenant> tenantMono = tenantService.update("", new Tenant());
        StepVerifier
                .create(tenantMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.ID)))
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateTenant_updateDisplayName_success() {
        Tenant update = new Tenant();
        String displayName = UUID.randomUUID().toString();
        update.setDisplayName(displayName);
        Mono<Tenant> tenantMono = sessionUserService.getCurrentUser()
                    .map(User::getTenantId)
                    .flatMap(tenantId -> tenantService.update(tenantId, update));

        StepVerifier
                .create(tenantMono)
                .assertNext(updated -> {
                    assertThat(updated.getDisplayName()).isEqualTo(displayName);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void updateTenant_updateSlug_slugUpdateIsUnsupported() {
        Tenant update = new Tenant();
        String slug = UUID.randomUUID().toString();
        update.setSlug(slug);
        Mono<Tenant> tenantMono = sessionUserService.getCurrentUser()
                .map(User::getTenantId)
                .flatMap(tenantId -> tenantService.update(tenantId, update));

        StepVerifier
                .create(tenantMono)
                .assertNext(updated -> {
                    assertThat(updated.getSlug()).isNotEqualTo(slug);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "developer@solutiontest.com")
    public void updateTenant_userWithoutManageTenantPermission_throwException() {
        Tenant update = new Tenant();
        String slug = UUID.randomUUID().toString();
        update.setSlug(slug);
        String tenantId = sessionUserService.getCurrentUser().map(User::getTenantId).block();
        Mono<Tenant> tenantMono = tenantService.update(tenantId, update);

        StepVerifier
                .create(tenantMono)
                .expectErrorMatches(throwable -> throwable instanceof AppsmithException
                        && throwable.getMessage().contains(AppsmithError.NO_RESOURCE_FOUND.getMessage(TENANT_ID, tenantId)))
                .verify();
    }

}