package com.appsmith.server.services.ce;

import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.EnvManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class TenantServiceCETest {

    @Autowired
    TenantService tenantService;

    @MockBean
    EnvManager envManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    MongoOperations mongoOperations;

    @BeforeEach
    public void setup() throws IOException {
        final Tenant tenant = tenantService.getDefaultTenant().block();
        assert tenant != null;
        mongoOperations.updateFirst(
                Query.query(Criteria.where(FieldName.ID).is(tenant.getId())),
                Update.update(fieldName(QTenant.tenant.tenantConfiguration), null),
                Tenant.class);

        // Make api_user super-user to test tenant admin functionality
        // Todo change this to tenant admin once we introduce multitenancy
        userRepository
                .findByEmail("api_user")
                .flatMap(user -> userUtils.makeSuperUser(List.of(user)))
                .block();
    }

    @Test
    void ensureMapsKey() {
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration().getGoogleMapsKey())
                            .isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setMapsKeyAndGetItBack() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<TenantConfiguration> resultMono =
                tenantService.updateDefaultTenantConfiguration(changes).map(Tenant::getTenantConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.getGoogleMapsKey()).isEqualTo("test-key");
                })
                .verifyComplete();
    }

    @Test
    void setMapsKeyWithoutAuthentication() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<?> resultMono = tenantService.updateDefaultTenantConfiguration(changes);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).startsWith("Unable to find tenant ");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    void setMapsKeyWithoutAuthorization() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setGoogleMapsKey("test-key");

        final Mono<?> resultMono = tenantService.updateDefaultTenantConfiguration(changes);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).startsWith("Unable to find tenant ");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("anonymousUser")
    void getTenantConfig_Valid_AnonymousUser() {
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense()).isNotNull();
                    assertThat(tenant.getTenantConfiguration().getLicense().getPlan())
                            .isEqualTo(LicensePlan.FREE);
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabled_WithInvalidSMTPHost_ReturnsError() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setEmailVerificationEnabled(Boolean.TRUE);

        Map<String, String> envVars = new HashMap<>();
        // adding invalid mail host
        envVars.put("APPSMITH_MAIL_HOST", "");

        // mocking env vars file
        Mockito.when(envManager.getAllNonEmpty()).thenReturn(Mono.just(envVars));

        final Mono<TenantConfiguration> resultMono = tenantService
                .updateDefaultTenantConfiguration(changes)
                .then(tenantService.getTenantConfiguration())
                .map(Tenant::getTenantConfiguration);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).startsWith("Your SMTP configuration is invalid");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabled_WithValidSMTPHost_Success() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setEmailVerificationEnabled(Boolean.TRUE);

        Map<String, String> envVars = new HashMap<>();
        // adding valid mail host
        envVars.put("APPSMITH_MAIL_HOST", "smtp.sendgrid.net");

        // mocking env vars file
        Mockito.when(envManager.getAllNonEmpty()).thenReturn(Mono.just(envVars));

        final Mono<TenantConfiguration> resultMono = tenantService
                .updateDefaultTenantConfiguration(changes)
                .then(tenantService.getTenantConfiguration())
                .map(Tenant::getTenantConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.getEmailVerificationEnabled())
                            .isTrue();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setEmailVerificationEnabledFalseAndGetItBack() {
        final TenantConfiguration changes = new TenantConfiguration();
        changes.setEmailVerificationEnabled(Boolean.FALSE);

        final Mono<TenantConfiguration> resultMono = tenantService
                .updateDefaultTenantConfiguration(changes)
                .then(tenantService.getTenantConfiguration())
                .map(Tenant::getTenantConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.getEmailVerificationEnabled())
                            .isFalse();
                })
                .verifyComplete();
    }
}
