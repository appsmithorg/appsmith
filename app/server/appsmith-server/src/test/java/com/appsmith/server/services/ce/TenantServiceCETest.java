package com.appsmith.server.services.ce;

import com.appsmith.server.TestUtils;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.QTenant;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.solutions.EnvManager;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.codec.multipart.Part;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
class TenantServiceCETest {

    @Autowired
    CommonConfig commonConfig;

    @Autowired
    TenantService tenantService;

    @Autowired
    TenantRepository tenantRepository;

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    EnvManager envManager;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    MongoOperations mongoOperations;

    String originalEnvFileContent;

    @BeforeEach
    public void setup() throws IOException {
        TestUtils.ensureFileExists(commonConfig.getEnvFilePath());
        if (originalEnvFileContent == null) {
            originalEnvFileContent = Files.readString(Path.of(commonConfig.getEnvFilePath()));
        }

        final Tenant tenant = tenantService.getDefaultTenant().block();
        assert tenant != null;
        mongoOperations.updateFirst(
                Query.query(Criteria.where(FieldName.ID).is(tenant.getId())),
                Update.update(fieldName(QTenant.tenant.tenantConfiguration), null),
                Tenant.class
        );

        // Make api_user super-user to test tenant admin functionality
        // Todo change this to tenant admin once we introduce multitenancy
        userRepository.findByEmail("api_user")
                .flatMap(user -> userUtils.makeSuperUser(List.of(user)))
                .block();
    }

    @AfterEach
    public void tearDown() throws IOException {
        Files.writeString(Path.of(commonConfig.getEnvFilePath()), originalEnvFileContent);
    }

    @Test
    void ensureMapsKey() {
        StepVerifier.create(tenantService.getTenantConfiguration())
                .assertNext(tenant -> {
                    assertThat(tenant.getTenantConfiguration().getGoogleMapsKey()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails("api_user")
    void setMapsKeyAndGetItBack() {
        MultiValueMap<String, Part> data = new LinkedMultiValueMap<>();

        data.add("APPSMITH_GOOGLE_MAPS_API_KEY", TestUtils.makeMockedFieldPart("test-key"));

        final Mono<TenantConfiguration> resultMono = envManager.applyChangesFromMultipartFormData(data)
                .then(tenantService.getTenantConfiguration())
                .map(Tenant::getTenantConfiguration);

        StepVerifier.create(resultMono)
                .assertNext(tenantConfiguration -> {
                    assertThat(tenantConfiguration.getGoogleMapsKey()).isEqualTo("test-key");
                })
                .verifyComplete();
    }

    @Test
    void setMapsKeyWithoutAuthentication() {
        MultiValueMap<String, Part> data = new LinkedMultiValueMap<>();

        data.add("APPSMITH_GOOGLE_MAPS_API_KEY", TestUtils.makeMockedFieldPart("test-key"));

        final Mono<Void> resultMono = envManager.applyChangesFromMultipartFormData(data);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).isEqualTo("Unauthorized access");
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails("usertest@usertest.com")
    void setMapsKeyWithoutAuthorization() {
        MultiValueMap<String, Part> data = new LinkedMultiValueMap<>();

        data.add("APPSMITH_GOOGLE_MAPS_API_KEY", TestUtils.makeMockedFieldPart("test-key"));

        final Mono<Void> resultMono = envManager.applyChangesFromMultipartFormData(data);

        StepVerifier.create(resultMono)
                .expectErrorMatches(error -> {
                    assertThat(error.getMessage()).isEqualTo("Unauthorized access");
                    return true;
                })
                .verify();
    }

}
