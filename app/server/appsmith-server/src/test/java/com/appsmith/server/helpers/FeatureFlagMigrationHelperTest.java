package com.appsmith.server.helpers;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.services.CacheableFeatureFlagHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static com.appsmith.external.enums.FeatureFlagEnum.TENANT_TEST_FEATURE;
import static com.appsmith.server.constants.FeatureMigrationType.DISABLE;
import static com.appsmith.server.constants.FeatureMigrationType.ENABLE;
import static com.appsmith.server.constants.MigrationStatus.PENDING;
import static org.assertj.core.api.AssertionsForInterfaceTypes.assertThat;
import static org.mockito.ArgumentMatchers.any;

@SpringBootTest
class FeatureFlagMigrationHelperTest {

    @MockBean
    CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

    @Autowired
    FeatureFlagMigrationHelper featureFlagMigrationHelper;

    @BeforeEach
    void setUp() {}

    @Test
    void getUpdatedFlagsWithPendingMigration_diffForExistingAndLatestFlag_pendingMigrationReportedWithDisableStatus() {
        Tenant defaultTenant = new Tenant();
        defaultTenant.setId(UUID.randomUUID().toString());
        defaultTenant.setTenantConfiguration(new TenantConfiguration());

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(TENANT_TEST_FEATURE.name(), true);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        CachedFeatures latestCachedFeatures = new CachedFeatures();
        Map<String, Boolean> latestFeatureMap = new HashMap<>();
        latestFeatureMap.put(TENANT_TEST_FEATURE.name(), false);
        latestCachedFeatures.setFeatures(latestFeatureMap);
        latestCachedFeatures.setRefreshedAt(Instant.now());

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedTenantFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures))
                .thenReturn(Mono.just(latestCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedTenantFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultTenant);

        StepVerifier.create(getUpdatedFlagsWithPendingMigration)
                .assertNext(featureFlagEnumFeatureMigrationTypeMap -> {
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isNotEmpty();
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).hasSize(1);
                    assertThat(featureFlagEnumFeatureMigrationTypeMap.get(TENANT_TEST_FEATURE))
                            .isEqualTo(DISABLE);
                })
                .verifyComplete();
    }

    @Test
    void getUpdatedFlagsWithPendingMigration_diffForExistingAndLatestFlag_pendingMigrationReportedWithEnableStatus() {
        Tenant defaultTenant = new Tenant();
        defaultTenant.setId(UUID.randomUUID().toString());
        defaultTenant.setTenantConfiguration(new TenantConfiguration());

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(TENANT_TEST_FEATURE.name(), false);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        CachedFeatures latestCachedFeatures = new CachedFeatures();
        Map<String, Boolean> latestFeatureMap = new HashMap<>();
        latestFeatureMap.put(TENANT_TEST_FEATURE.name(), true);
        latestCachedFeatures.setFeatures(latestFeatureMap);
        latestCachedFeatures.setRefreshedAt(Instant.now());

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedTenantFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures))
                .thenReturn(Mono.just(latestCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedTenantFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultTenant);

        StepVerifier.create(getUpdatedFlagsWithPendingMigration)
                .assertNext(featureFlagEnumFeatureMigrationTypeMap -> {
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isNotEmpty();
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).hasSize(1);
                    assertThat(featureFlagEnumFeatureMigrationTypeMap.get(TENANT_TEST_FEATURE))
                            .isEqualTo(ENABLE);
                })
                .verifyComplete();
    }

    @Test
    void getUpdatedFlagsWithPendingMigration_noDiffForExistingAndLatestFlag_noPendingMigrations() {
        Tenant defaultTenant = new Tenant();
        defaultTenant.setId(UUID.randomUUID().toString());
        defaultTenant.setTenantConfiguration(new TenantConfiguration());

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(TENANT_TEST_FEATURE.name(), true);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedTenantFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedTenantFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultTenant);

        StepVerifier.create(getUpdatedFlagsWithPendingMigration)
                .assertNext(featureFlagEnumFeatureMigrationTypeMap -> {
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isNotNull();
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isEmpty();
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).hasSize(0);
                })
                .verifyComplete();
    }

    @Test
    void getUpdatedFlagsWithPendingMigration_fetchTenantFlagsFailedFromCS_pendingMigrationReported() {
        Tenant defaultTenant = new Tenant();
        defaultTenant.setId(UUID.randomUUID().toString());
        defaultTenant.setTenantConfiguration(new TenantConfiguration());

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(TENANT_TEST_FEATURE.name(), true);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        CachedFeatures latestCachedFeatures = new CachedFeatures();
        existingCachedFeatures.setFeatures(new HashMap<>());
        existingCachedFeatures.setRefreshedAt(Instant.now());

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedTenantFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures))
                .thenReturn(Mono.just(latestCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.updateCachedTenantFeatures(any(), any()))
                .thenReturn(Mono.just(existingCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedTenantFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultTenant);

        StepVerifier.create(getUpdatedFlagsWithPendingMigration)
                .assertNext(featureFlagEnumFeatureMigrationTypeMap -> {
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isNotNull();
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isEmpty();
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).hasSize(0);
                })
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForFeatureFlag_nullFeatureFlag_success() {
        Tenant defaultTenant = new Tenant();
        Mono<Boolean> resultMono =
                featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(defaultTenant, null);
        StepVerifier.create(resultMono)
                .assertNext(result -> assertThat(result).isTrue())
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForFeatureFlag_validFeatureFlag_success() {
        Tenant defaultTenant = new Tenant();
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setFeaturesWithPendingMigration(Map.of(TENANT_TEST_FEATURE, ENABLE));
        tenantConfiguration.setMigrationStatus(PENDING);
        defaultTenant.setTenantConfiguration(tenantConfiguration);

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(TENANT_TEST_FEATURE.name(), true);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.HOURS));
        Mockito.when(cacheableFeatureFlagHelper.fetchCachedTenantFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures));

        Mono<Boolean> resultMono =
                featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(defaultTenant, TENANT_TEST_FEATURE);
        StepVerifier.create(resultMono)
                .assertNext(result -> {
                    assertThat(result).isTrue();
                    assertThat(tenantConfiguration.getFeaturesWithPendingMigration())
                            .hasSize(1);
                    assertThat(tenantConfiguration.getMigrationStatus()).isEqualTo(PENDING);
                })
                .verifyComplete();
    }

    @Test
    void
            getUpdatedFlagsWithPendingMigration_diffForExistingAndLatestFlag_sameFlagIsFlippedAsPerDBState_flagGetsRemovedFromPendingMigrationList() {

        // Mock DB state to have the feature flag in pending migration list with DISABLE status which means the feature
        // flag flipped from true to false
        Tenant defaultTenant = new Tenant();
        defaultTenant.setId(UUID.randomUUID().toString());
        TenantConfiguration tenantConfiguration = new TenantConfiguration();
        tenantConfiguration.setFeaturesWithPendingMigration(Map.of(TENANT_TEST_FEATURE, DISABLE));
        defaultTenant.setTenantConfiguration(tenantConfiguration);

        // Mock CS calls to fetch the feature flags to have the feature flag in pending migration list with ENABLE
        // status
        // This means the feature flag flipped from false to true again with latest check
        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(TENANT_TEST_FEATURE.name(), false);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        CachedFeatures latestCachedFeatures = new CachedFeatures();
        Map<String, Boolean> latestFeatureMap = new HashMap<>();
        latestFeatureMap.put(TENANT_TEST_FEATURE.name(), true);
        latestCachedFeatures.setFeatures(latestFeatureMap);
        latestCachedFeatures.setRefreshedAt(Instant.now());

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedTenantFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures))
                .thenReturn(Mono.just(latestCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedTenantFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultTenant);

        StepVerifier.create(getUpdatedFlagsWithPendingMigration)
                .assertNext(featureFlagEnumFeatureMigrationTypeMap -> {
                    // As the feature flag is flipped back to true, the feature flag should be removed from the pending
                    // migration entries as the migration is no longer required
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isEmpty();
                })
                .verifyComplete();
    }
}
