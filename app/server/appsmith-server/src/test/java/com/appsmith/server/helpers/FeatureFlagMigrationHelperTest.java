package com.appsmith.server.helpers;

import com.appsmith.external.enums.FeatureFlagEnum;
import com.appsmith.server.constants.FeatureMigrationType;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.OrganizationConfiguration;
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

import static com.appsmith.external.enums.FeatureFlagEnum.ORGANIZATION_TEST_FEATURE;
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
        Organization defaultOrganization = new Organization();
        defaultOrganization.setId(UUID.randomUUID().toString());
        defaultOrganization.setOrganizationConfiguration(new OrganizationConfiguration());

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(ORGANIZATION_TEST_FEATURE.name(), true);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        CachedFeatures latestCachedFeatures = new CachedFeatures();
        Map<String, Boolean> latestFeatureMap = new HashMap<>();
        latestFeatureMap.put(ORGANIZATION_TEST_FEATURE.name(), false);
        latestCachedFeatures.setFeatures(latestFeatureMap);
        latestCachedFeatures.setRefreshedAt(Instant.now());

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedOrganizationFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures))
                .thenReturn(Mono.just(latestCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedOrganizationFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultOrganization);

        StepVerifier.create(getUpdatedFlagsWithPendingMigration)
                .assertNext(featureFlagEnumFeatureMigrationTypeMap -> {
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isNotEmpty();
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).hasSize(1);
                    assertThat(featureFlagEnumFeatureMigrationTypeMap.get(ORGANIZATION_TEST_FEATURE))
                            .isEqualTo(DISABLE);
                })
                .verifyComplete();
    }

    @Test
    void getUpdatedFlagsWithPendingMigration_diffForExistingAndLatestFlag_pendingMigrationReportedWithEnableStatus() {
        Organization defaultOrganization = new Organization();
        defaultOrganization.setId(UUID.randomUUID().toString());
        defaultOrganization.setOrganizationConfiguration(new OrganizationConfiguration());

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(ORGANIZATION_TEST_FEATURE.name(), false);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        CachedFeatures latestCachedFeatures = new CachedFeatures();
        Map<String, Boolean> latestFeatureMap = new HashMap<>();
        latestFeatureMap.put(ORGANIZATION_TEST_FEATURE.name(), true);
        latestCachedFeatures.setFeatures(latestFeatureMap);
        latestCachedFeatures.setRefreshedAt(Instant.now());

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedOrganizationFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures))
                .thenReturn(Mono.just(latestCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedOrganizationFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultOrganization);

        StepVerifier.create(getUpdatedFlagsWithPendingMigration)
                .assertNext(featureFlagEnumFeatureMigrationTypeMap -> {
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isNotEmpty();
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).hasSize(1);
                    assertThat(featureFlagEnumFeatureMigrationTypeMap.get(ORGANIZATION_TEST_FEATURE))
                            .isEqualTo(ENABLE);
                })
                .verifyComplete();
    }

    @Test
    void getUpdatedFlagsWithPendingMigration_noDiffForExistingAndLatestFlag_noPendingMigrations() {
        Organization defaultOrganization = new Organization();
        defaultOrganization.setId(UUID.randomUUID().toString());
        defaultOrganization.setOrganizationConfiguration(new OrganizationConfiguration());

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(ORGANIZATION_TEST_FEATURE.name(), true);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedOrganizationFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedOrganizationFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultOrganization);

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
        Organization defaultOrganization = new Organization();
        defaultOrganization.setId(UUID.randomUUID().toString());
        defaultOrganization.setOrganizationConfiguration(new OrganizationConfiguration());

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(ORGANIZATION_TEST_FEATURE.name(), true);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.HOURS));

        CachedFeatures latestCachedFeatures = new CachedFeatures();
        existingCachedFeatures.setFeatures(new HashMap<>());
        existingCachedFeatures.setRefreshedAt(Instant.now());

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedOrganizationFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures))
                .thenReturn(Mono.just(latestCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.updateCachedOrganizationFeatures(any(), any()))
                .thenReturn(Mono.just(existingCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedOrganizationFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultOrganization);

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
        Organization defaultOrganization = new Organization();
        Mono<Boolean> resultMono =
                featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(defaultOrganization, null);
        StepVerifier.create(resultMono)
                .assertNext(result -> assertThat(result).isTrue())
                .verifyComplete();
    }

    @Test
    void checkAndExecuteMigrationsForFeatureFlag_validFeatureFlag_success() {
        Organization defaultOrganization = new Organization();
        OrganizationConfiguration tenantConfiguration = new OrganizationConfiguration();
        tenantConfiguration.setFeaturesWithPendingMigration(Map.of(ORGANIZATION_TEST_FEATURE, ENABLE));
        tenantConfiguration.setMigrationStatus(PENDING);
        defaultOrganization.setOrganizationConfiguration(tenantConfiguration);

        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(ORGANIZATION_TEST_FEATURE.name(), true);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.HOURS));
        Mockito.when(cacheableFeatureFlagHelper.fetchCachedOrganizationFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures));

        Mono<Boolean> resultMono = featureFlagMigrationHelper.checkAndExecuteMigrationsForFeatureFlag(
                defaultOrganization, ORGANIZATION_TEST_FEATURE);
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
        Organization defaultOrganization = new Organization();
        defaultOrganization.setId(UUID.randomUUID().toString());
        OrganizationConfiguration tenantConfiguration = new OrganizationConfiguration();
        tenantConfiguration.setFeaturesWithPendingMigration(Map.of(ORGANIZATION_TEST_FEATURE, DISABLE));
        defaultOrganization.setOrganizationConfiguration(tenantConfiguration);

        // Mock CS calls to fetch the feature flags to have the feature flag in pending migration list with ENABLE
        // status
        // This means the feature flag flipped from false to true again with latest check
        CachedFeatures existingCachedFeatures = new CachedFeatures();
        Map<String, Boolean> featureMap = new HashMap<>();
        featureMap.put(ORGANIZATION_TEST_FEATURE.name(), false);
        existingCachedFeatures.setFeatures(featureMap);
        existingCachedFeatures.setRefreshedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        CachedFeatures latestCachedFeatures = new CachedFeatures();
        Map<String, Boolean> latestFeatureMap = new HashMap<>();
        latestFeatureMap.put(ORGANIZATION_TEST_FEATURE.name(), true);
        latestCachedFeatures.setFeatures(latestFeatureMap);
        latestCachedFeatures.setRefreshedAt(Instant.now());

        Mockito.when(cacheableFeatureFlagHelper.fetchCachedOrganizationFeatures(any()))
                .thenReturn(Mono.just(existingCachedFeatures))
                .thenReturn(Mono.just(latestCachedFeatures));

        Mockito.when(cacheableFeatureFlagHelper.evictCachedOrganizationFeatures(any()))
                .thenReturn(Mono.empty());

        Mono<Map<FeatureFlagEnum, FeatureMigrationType>> getUpdatedFlagsWithPendingMigration =
                featureFlagMigrationHelper.getUpdatedFlagsWithPendingMigration(defaultOrganization);

        StepVerifier.create(getUpdatedFlagsWithPendingMigration)
                .assertNext(featureFlagEnumFeatureMigrationTypeMap -> {
                    // As the feature flag is flipped back to true, the feature flag should be removed from the pending
                    // migration entries as the migration is no longer required
                    assertThat(featureFlagEnumFeatureMigrationTypeMap).isEmpty();
                })
                .verifyComplete();
    }
}
