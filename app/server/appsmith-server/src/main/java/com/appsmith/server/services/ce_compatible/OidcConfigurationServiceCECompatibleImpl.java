package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.domains.TenantConfiguration;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class OidcConfigurationServiceCECompatibleImpl implements OidcConfigurationServiceCECompatible {

    @Override
    public TenantConfiguration getTenantConfiguration(TenantConfiguration tenantConfiguration) {
        if (tenantConfiguration != null && tenantConfiguration.getThirdPartyAuths() != null) {
            // Can't update the list directly as it's throwing java.lang.UnsupportedOperationException exception as
            // modification is not supported.
            List<String> thirdPartyAuths = new ArrayList<>(tenantConfiguration.getThirdPartyAuths());
            thirdPartyAuths.remove("oidc");
            tenantConfiguration.setThirdPartyAuths(thirdPartyAuths);
        }
        return tenantConfiguration != null ? tenantConfiguration : new TenantConfiguration();
    }
}
