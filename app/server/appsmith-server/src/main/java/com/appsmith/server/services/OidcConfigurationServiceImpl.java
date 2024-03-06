package com.appsmith.server.services;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.TenantConfiguration;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.services.ce_compatible.OidcConfigurationServiceCECompatibleImpl;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class OidcConfigurationServiceImpl extends OidcConfigurationServiceCECompatibleImpl
        implements OidcConfigurationService {

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_sso_oidc_enabled)
    @Override
    public TenantConfiguration getTenantConfiguration(TenantConfiguration tenantConfiguration) {
        if (StringUtils.hasText(System.getenv("APPSMITH_OAUTH2_OIDC_CLIENT_ID"))) {
            tenantConfiguration.addThirdPartyAuth("oidc");
        }
        return tenantConfiguration;
    }
}
