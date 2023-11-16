package com.appsmith.server.services;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.FeaturesRequestDTO;
import com.appsmith.server.dtos.FeaturesResponseDTO;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.CacheableFeatureFlagHelperCEImpl;
import com.appsmith.server.solutions.LicenseAPIManager;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;
import static com.appsmith.server.featureflags.FeatureFlagEnum.release_datasource_environments_enabled;
import static java.lang.Boolean.TRUE;

@Component
@Slf4j
public class CacheableFeatureFlagHelperImpl extends CacheableFeatureFlagHelperCEImpl
        implements CacheableFeatureFlagHelper {
    private final TenantRepository tenantRepository;
    private final AirgapInstanceConfig airgapInstanceConfig;
    private final LicenseAPIManager licenseAPIManager;

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

    public CacheableFeatureFlagHelperImpl(
            TenantRepository tenantRepository,
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig,
            CommonConfig commonConfig,
            UserIdentifierService userIdentifierService,
            ReleaseNotesService releaseNotesService,
            AirgapInstanceConfig airgapInstanceConfig,
            LicenseAPIManager licenseAPIManager) {
        super(
                tenantRepository,
                configService,
                cloudServicesConfig,
                commonConfig,
                userIdentifierService,
                releaseNotesService);
        this.tenantRepository = tenantRepository;
        this.airgapInstanceConfig = airgapInstanceConfig;
        this.licenseAPIManager = licenseAPIManager;
    }

    /**
     * If the instance is AIR_GAP tenant features will be embedded in the license key
     * @param featuresRequestDTO FeaturesRequestDTO
     * @return Mono of FeaturesResponseDTO
     */
    @Override
    public Mono<FeaturesResponseDTO> getRemoteFeaturesForTenant(FeaturesRequestDTO featuresRequestDTO) {
        if (airgapInstanceConfig.isAirgapEnabled()) {
            FeaturesResponseDTO featuresResponseDTO = new FeaturesResponseDTO();
            featuresResponseDTO.setFeatures(new HashMap<>());
            return tenantRepository
                    .findBySlug(DEFAULT)
                    .flatMap(licenseAPIManager::licenseCheck)
                    .map(license -> {
                        Map<String, Boolean> features = new HashMap<>();
                        // Enable all the licensed feature flags to provide the support for all the GA features for
                        // legacy licenses
                        AIRGAPPED_LICENSED_DEFAULT_FEATURE_FLAGS.listIterator().forEachRemaining(featureFlagEnum -> {
                            features.put(featureFlagEnum.toString(), TRUE);
                        });
                        if (license.getTenantFeatures() != null) {
                            features.putAll(license.getTenantFeatures());
                        }
                        featuresResponseDTO.setFeatures(features);
                        return featuresResponseDTO;
                    });
        }

        return super.getRemoteFeaturesForTenant(featuresRequestDTO);
    }
}
