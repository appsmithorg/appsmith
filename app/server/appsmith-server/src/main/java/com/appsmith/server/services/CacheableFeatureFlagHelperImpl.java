package com.appsmith.server.services;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ce.FeaturesRequestDTO;
import com.appsmith.server.dtos.ce.FeaturesResponseDTO;
import com.appsmith.server.repositories.TenantRepository;
import com.appsmith.server.services.ce.CacheableFeatureFlagHelperCEImpl;
import com.appsmith.server.solutions.LicenseAPIManager;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;

import static com.appsmith.server.constants.ce.FieldNameCE.DEFAULT;

@Component
@Slf4j
public class CacheableFeatureFlagHelperImpl extends CacheableFeatureFlagHelperCEImpl
        implements CacheableFeatureFlagHelper {
    private final TenantRepository tenantRepository;
    private final AirgapInstanceConfig airgapInstanceConfig;
    private final LicenseAPIManager licenseAPIManager;

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
                        if (license.getTenantFeatures() != null) {
                            featuresResponseDTO.setFeatures(license.getTenantFeatures());
                        }
                        return featuresResponseDTO;
                    });
        }

        return super.getRemoteFeaturesForTenant(featuresRequestDTO);
    }
}
