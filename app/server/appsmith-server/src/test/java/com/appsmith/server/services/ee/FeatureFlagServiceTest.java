package com.appsmith.server.services.ee;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.constants.LicensePlan;
import com.appsmith.server.constants.MigrationStatus;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.dtos.ce.FeaturesRequestDTO;
import com.appsmith.server.dtos.ce.FeaturesResponseDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.FeatureFlagMigrationHelper;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.FeatureFlagServiceImpl;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
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

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.server.featureflags.FeatureFlagEnum.license_pac_enabled;
import static com.appsmith.server.featureflags.FeatureFlagEnum.release_datasource_environments_enabled;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertFalse;
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

    @SpyBean
    CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    @Autowired
    FeatureFlagMigrationHelper featureFlagMigrationHelper;

    @MockBean
    AirgapInstanceConfig instanceConfig;

    private static final List<FeatureFlagEnum> AIRGAPPED_LICENSED_DEFAULT_FEATURE_FLAGS = new LinkedList<>();
    // List of all feature flags required for legacy licenses, where feature flag information was not included within
    // the license key itself
    static {
        Arrays.stream(FeatureFlagEnum.values())
                .filter(featureFlagEnum -> featureFlagEnum.name().startsWith("license_"))
                .forEach(AIRGAPPED_LICENSED_DEFAULT_FEATURE_FLAGS::add);

        // Exception for multiple environment as this is already a GA feature
        AIRGAPPED_LICENSED_DEFAULT_FEATURE_FLAGS.add(release_datasource_environments_enabled);
    }

    @BeforeEach
    public void setup() {
        featureFlagService = new FeatureFlagServiceImpl(
                sessionUserService,
                ff4j,
                tenantService,
                userIdentifierService,
                cacheableFeatureFlagHelper,
                featureFlagMigrationHelper,
                instanceConfig);

        Mockito.when(instanceConfig.isAirgapEnabled()).thenReturn(true);
    }

    @Test
    public void getAllFeatureFlagsForUser_withTenantIdentifier_AirGapLicenseWithoutEmbeddedFlags_enabledGAFlags() {
        String tenantIdentifier = UUID.randomUUID().toString();
        doReturn(Mono.just(tenantIdentifier)).when(tenantService).getDefaultTenantId();

        FeaturesResponseDTO responseDTO = new FeaturesResponseDTO();
        responseDTO.setFeatures(new HashMap<>());
        doReturn(Mono.just(responseDTO))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForTenant(any(FeaturesRequestDTO.class));
        Mono<Map<String, Boolean>> currentTenantFeaturesMono = featureFlagService.getAllFeatureFlagsForUser();
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("tenantNewFeatures:" + tenantIdentifier);
        StepVerifier.create(currentTenantFeaturesMono.zipWhen(ignore -> hasKeyMono))
                .assertNext(tuple -> {
                    Map<String, Boolean> features = tuple.getT1();
                    Boolean isKeyPresent = tuple.getT2();
                    assertTrue(isKeyPresent);
                    AIRGAPPED_LICENSED_DEFAULT_FEATURE_FLAGS.forEach(featureFlagEnum -> {
                        assertTrue(features.containsKey(featureFlagEnum.toString()));
                        assertTrue(features.get(featureFlagEnum.toString()));
                    });
                })
                .verifyComplete();
    }

    @Test
    public void
            getAllFeatureFlagsForUser_withTenantIdentifier_airgappedLicenseWithEmbeddedFlags_overrideGAFlagsWithLicenseFlags() {
        String tenantIdentifier = UUID.randomUUID().toString();
        doReturn(Mono.just(tenantIdentifier)).when(tenantService).getDefaultTenantId();

        FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
        Map<String, Boolean> flags = new HashMap<>();
        flags.put(license_pac_enabled.toString(), false);
        featuresResponseDTO.setFeatures(flags);
        doReturn(Mono.just(featuresResponseDTO))
                .when(cacheableFeatureFlagHelper)
                .getRemoteFeaturesForTenant(any(FeaturesRequestDTO.class));

        Mono<Map<String, Boolean>> currentTenantFeaturesMono = featureFlagService.getAllFeatureFlagsForUser();
        Mono<Boolean> hasKeyMono = reactiveRedisTemplate.hasKey("tenantNewFeatures:" + tenantIdentifier);
        StepVerifier.create(currentTenantFeaturesMono.zipWhen(ignore -> hasKeyMono))
                .assertNext(tuple -> {
                    Map<String, Boolean> features = tuple.getT1();
                    Boolean isKeyPresent = tuple.getT2();
                    assertTrue(isKeyPresent);
                    AIRGAPPED_LICENSED_DEFAULT_FEATURE_FLAGS.forEach(featureFlagEnum -> {
                        assertTrue(features.containsKey(featureFlagEnum.toString()));
                        if (featureFlagEnum.equals(license_pac_enabled)) {
                            assertFalse(features.get(featureFlagEnum.name()));
                        } else {
                            assertTrue(features.get(featureFlagEnum.name()));
                        }
                    });
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForTenantFeatureFlags_pendingMigrations_activeLicense_differentPlans_updateStatus() {
        Tenant tenant = new Tenant();
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setFeaturesWithPendingMigration(
                Map.of(FeatureFlagEnum.TENANT_TEST_FEATURE, FeatureMigrationType.ENABLE));
        License license = new License();
        license.setActive(true);
        license.setPreviousPlan(LicensePlan.FREE);
        license.setPlan(LicensePlan.SELF_SERVE);

        tenantConfiguration.setLicense(license);
        tenant.setTenantConfiguration(tenantConfiguration);
        Mono<Tenant> tenantMono = featureFlagService.checkAndExecuteMigrationsForTenantFeatureFlags(tenant);

        StepVerifier.create(tenantMono)
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getMigrationStatus())
                            .isEqualTo(MigrationStatus.PENDING);
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForTenantFeatureFlags_pendingMigrations_expiredLicense_samePlan_updateStatus() {
        Tenant tenant = new Tenant();
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setFeaturesWithPendingMigration(
                Map.of(FeatureFlagEnum.TENANT_TEST_FEATURE, FeatureMigrationType.ENABLE));
        License license = new License();
        license.setActive(false);
        license.setPlan(LicensePlan.SELF_SERVE);
        license.setPreviousPlan(LicensePlan.SELF_SERVE);
        tenantConfiguration.setLicense(license);
        tenant.setTenantConfiguration(tenantConfiguration);
        Mono<Tenant> tenantMono = featureFlagService.checkAndExecuteMigrationsForTenantFeatureFlags(tenant);

        StepVerifier.create(tenantMono)
                .assertNext(tenant1 -> {
                    assertThat(tenant1.getTenantConfiguration().getMigrationStatus())
                            .isEqualTo(MigrationStatus.PENDING);
                })
                .verifyComplete();
    }
}
