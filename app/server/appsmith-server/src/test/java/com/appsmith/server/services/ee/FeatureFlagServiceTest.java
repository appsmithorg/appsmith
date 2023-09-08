package com.appsmith.server.services.ee;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.License;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.FeatureFlagServiceImpl;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
import com.appsmith.server.solutions.LicenseAPIManager;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.FF4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class FeatureFlagServiceTest {
    FeatureFlagService featureFlagService;

    @Autowired
    ReactiveRedisTemplate<String, Object> reactiveRedisTemplate;

    @MockBean
    LicenseAPIManager licenseAPIManager;

    @Autowired
    SessionUserService sessionUserService;

    @Autowired
    FF4j ff4j;

    @SpyBean
    TenantService tenantService;

    @Autowired
    ConfigService configService;

    @Autowired
    CloudServicesConfig cloudServicesConfig;

    @Autowired
    UserIdentifierService userIdentifierService;

    @Autowired
    CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    @MockBean
    AirgapInstanceConfig instanceConfig;

    @BeforeEach
    public void setup() {
        featureFlagService = new FeatureFlagServiceImpl(
                sessionUserService,
                ff4j,
                tenantService,
                configService,
                cloudServicesConfig,
                userIdentifierService,
                cacheableFeatureFlagHelper,
                instanceConfig);
    }

    @Test
    public void getFeatures_withTenantIdentifier_AirGapLicense_redisKeyExists() {
        Map<String, Boolean> flags = new HashMap<>();
        flags.put(UUID.randomUUID().toString(), true);
        flags.put(UUID.randomUUID().toString(), false);

        License license = new License();
        license.setTenantFeatures(flags);

        String tenantIdentifier = UUID.randomUUID().toString();

        doReturn(Mono.just(license)).when(licenseAPIManager).licenseCheck(any());

        doReturn(Mono.just(tenantIdentifier)).when(tenantService).getDefaultTenantId();

        Mockito.when(instanceConfig.isAirgapEnabled()).thenReturn(true);

        Mono<Map<String, Boolean>> currentTenantFeaturesMono = featureFlagService.getTenantFeatures();
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("tenantNewFeatures:" + tenantIdentifier);
        StepVerifier.create(currentTenantFeaturesMono.then(hasKeyMono))
                .assertNext(isKeyPresent -> {
                    assertTrue(isKeyPresent);
                })
                .verifyComplete();
    }
}
