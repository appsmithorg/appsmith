package com.appsmith.server.services.activation;

import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.configurations.FeatureFlagValidationContextConfig;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.filters.MDCFilter;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.FeatureFlagServiceImpl;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.TenantService;
import com.appsmith.server.services.UserIdentifierService;
import org.ff4j.FF4j;
import org.slf4j.MDC;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@Primary
public class FeatureFlagServiceImplAB extends FeatureFlagServiceImpl {
    public FeatureFlagServiceImplAB(SessionUserService sessionUserService, FF4j ff4j, TenantService tenantService,
                                  ConfigService configService, CloudServicesConfig cloudServicesConfig,
                                  UserIdentifierService userIdentifierService,
                                  FeatureFlagValidationContextConfig featureFlagValidationContextConfig){
        super(sessionUserService, ff4j, tenantService, configService, cloudServicesConfig, userIdentifierService, featureFlagValidationContextConfig);
    }

    @Override
    public Mono<Boolean> check(FeatureFlagEnum featureEnum) {
        switch (MDC.get(MDCFilter.ABFLAG)) {
            case "onFlag":
                return this.checkOnFlag(featureEnum);
            default:
                return super.check(featureEnum);
        }
    }

    public Mono<Boolean> checkOnFlag(FeatureFlagEnum featureEnum) {
        return Mono.just(false);
    }

}
