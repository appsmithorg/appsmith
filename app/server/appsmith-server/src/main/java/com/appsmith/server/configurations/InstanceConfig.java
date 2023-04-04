package com.appsmith.server.configurations;

import com.appsmith.server.configurations.ce.InstanceConfigCE;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import com.appsmith.server.services.ConfigService;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InstanceConfig extends InstanceConfigCE {

    public InstanceConfig(ConfigService configService,
                          CloudServicesConfig cloudServicesConfig,
                          CommonConfig commonConfig,
                          ApplicationContext applicationContext,
                          CacheableRepositoryHelper cacheableRepositoryHelper) {

        super(configService, cloudServicesConfig, commonConfig, applicationContext, cacheableRepositoryHelper);
    }

}
