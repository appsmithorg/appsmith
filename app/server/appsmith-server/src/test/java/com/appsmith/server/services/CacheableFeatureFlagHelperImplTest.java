package com.appsmith.server.services;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.License;
import com.appsmith.server.domains.Tenant;
import com.appsmith.server.dtos.FeaturesRequestDTO;
import com.appsmith.server.dtos.FeaturesResponseDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.solutions.LicenseAPIManager;
import com.appsmith.server.solutions.ReleaseNotesService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.featureflags.FeatureFlagEnum.license_pac_enabled;
import static com.appsmith.server.featureflags.FeatureFlagEnum.release_datasource_environments_enabled;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;

/**
 * Unit tests for CacheableFeatureFlagHelperImpl for offline license scenarios (airgap) where the feature flags are
 * embedded within the license key itself.
 * This class should be restricted to test the offline license scenarios only. For online license scenarios, please use
 * {@link com.appsmith.server.services.ee.FeatureFlagServiceTest}. This is to avoid unwanted entries getting created on
 * Flagsmith.
 *
 */
@SpringBootTest
@ExtendWith(SpringExtension.class)
class CacheableFeatureFlagHelperImplTest {

    @SpyBean
    LicenseAPIManager licenseAPIManager;

    @Autowired
    ReleaseNotesService releaseNotesService;

    @Autowired
    TenantRepository tenantRepository;

    @Autowired
    CommonConfig commonConfig;

    @Autowired
    UserIdentifierService userIdentifierService;

    @Autowired
    ConfigService configService;

    @Autowired
    CloudServicesConfig cloudServicesConfig;

    @Autowired
    AirgapInstanceConfig instanceConfig;

    private static CacheableFeatureFlagHelper cacheableFeatureFlagHelper;

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
    void setUp() {
        if (cacheableFeatureFlagHelper == null) {
            cacheableFeatureFlagHelper = new CacheableFeatureFlagHelperImpl(
                    tenantRepository,
                    configService,
                    cloudServicesConfig,
                    commonConfig,
                    userIdentifierService,
                    releaseNotesService,
                    instanceConfig,
                    licenseAPIManager);
        }
        instanceConfig.setAirgapEnabled(true);
    }

    @Test
    public void getTenantFeatures_withTenantIdentifier_AirGapLicenseWithoutEmbeddedFlags_enabledGAFlags() {

        doReturn(Mono.just(new License())).when(licenseAPIManager).licenseCheck(any(Tenant.class));
        Mono<Map<String, Boolean>> currentTenantFeaturesMono = cacheableFeatureFlagHelper
                .getRemoteFeaturesForTenant(new FeaturesRequestDTO())
                .map(FeaturesResponseDTO::getFeatures);

        StepVerifier.create(currentTenantFeaturesMono)
                .assertNext(features -> {
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
        License license = new License();
        Map<String, Boolean> flags = new HashMap<>();
        flags.put(license_pac_enabled.toString(), false);
        license.setTenantFeatures(flags);
        doReturn(Mono.just(license)).when(licenseAPIManager).licenseCheck(any(Tenant.class));

        Mono<Map<String, Boolean>> currentTenantFeaturesMono = cacheableFeatureFlagHelper
                .getRemoteFeaturesForTenant(new FeaturesRequestDTO())
                .map(FeaturesResponseDTO::getFeatures);
        StepVerifier.create(currentTenantFeaturesMono)
                .assertNext(features -> {
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
}
