package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.CustomServerOAuth2AuthorizationRequestResolverCE;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.services.TenantService;
import org.springframework.stereotype.Component;

@Component
public class CustomServerOAuth2AuthorizationRequestResolver extends CustomServerOAuth2AuthorizationRequestResolverCE {

    public CustomServerOAuth2AuthorizationRequestResolver(
            CommonConfig commonConfig, RedirectHelper redirectHelper, TenantService tenantService) {
        super(commonConfig, redirectHelper, tenantService);
    }
}
