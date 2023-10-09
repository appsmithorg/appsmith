package com.appsmith.server.helpers;

import com.appsmith.server.configurations.AirgapInstanceConfig;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.Appsmith;
import com.appsmith.server.domains.Config;
import com.appsmith.server.helpers.ce.InstanceConfigHelperCEImpl;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.TenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.Map;

@Component
@Slf4j
public class InstanceConfigHelperImpl extends InstanceConfigHelperCEImpl implements InstanceConfigHelper {

    private final TenantService tenantService;

    private final AirgapInstanceConfig airgapInstanceConfig;

    private final ConfigService configService;

    public InstanceConfigHelperImpl(
            ConfigService configService,
            CloudServicesConfig cloudServicesConfig,
            CommonConfig commonConfig,
            ApplicationContext applicationContext,
            TenantService tenantService,
            AirgapInstanceConfig airgapInstanceConfig,
            ReactiveMongoTemplate reactiveMongoTemplate,
            FeatureFlagService featureFlagService) {
        super(
                configService,
                cloudServicesConfig,
                commonConfig,
                applicationContext,
                reactiveMongoTemplate,
                featureFlagService);
        this.tenantService = tenantService;
        this.airgapInstanceConfig = airgapInstanceConfig;
        this.configService = configService;
    }

    @Override
    public Mono<Boolean> isLicenseValid() {
        // TODO introduce license check for all the tenants once the multi-tenancy is introduced
        return tenantService
                .checkAndUpdateDefaultTenantLicense()
                .map(tenant -> tenant.getTenantConfiguration() != null
                        && tenant.getTenantConfiguration().getLicense() != null
                        && tenant.getTenantConfiguration().getLicense().getActive());
    }

    @Override
    public Mono<? extends Config> registerInstance() {
        if (airgapInstanceConfig.isAirgapEnabled()) {
            log.debug("Registration successful for air-gap instance , updating state ...");
            return configService.save(Appsmith.APPSMITH_REGISTERED, Map.of("value", true));
        }
        return super.registerInstance();
    }
}
