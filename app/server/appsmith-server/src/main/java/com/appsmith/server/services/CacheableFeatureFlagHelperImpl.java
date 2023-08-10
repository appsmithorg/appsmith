package com.appsmith.server.services;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.dtos.ce.FeaturesRequestDTO;
import com.appsmith.server.dtos.ce.FeaturesResponseDTO;
import com.appsmith.server.services.ce.CacheableFeatureFlagHelperCEImpl;
import com.appsmith.server.solutions.LicenseAPIManager;
import com.appsmith.server.solutions.ReleaseNotesService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.HashMap;

@Component
@Slf4j
public class CacheableFeatureFlagHelperImpl extends CacheableFeatureFlagHelperCEImpl
        implements CacheableFeatureFlagHelper {
    TenantService tenantService;
    AirgapInstanceConfig airgapInstanceConfig;
    LicenseAPIManager licenseAPIManager;

    public CacheableFeatureFlagHelperImpl(
            TenantService tenantService,
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig,
            CommonConfig commonConfig,
            UserIdentifierService userIdentifierService,
            ReleaseNotesService releaseNotesService,
            AirgapInstanceConfig airgapInstanceConfig,
            LicenseAPIManager licenseAPIManager) {
        super(
                tenantService,
                configService,
                cloudServicesConfig,
                commonConfig,
                userIdentifierService,
                releaseNotesService);
        this.tenantService = tenantService;
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
            return tenantService
                    .getDefaultTenant()
                    .flatMap(tenant -> licenseAPIManager.licenseCheck(tenant))
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
