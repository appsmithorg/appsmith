package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.CustomServerOAuth2AuthorizationRequestResolverCE;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.configurations.OAuth2ClientRegistrationRepository;
import com.appsmith.server.helpers.RedirectHelper;
import org.springframework.stereotype.Component;

@Component
public class CustomServerOAuth2AuthorizationRequestResolver extends CustomServerOAuth2AuthorizationRequestResolverCE {

    public CustomServerOAuth2AuthorizationRequestResolver(
            CommonConfig commonConfig,
            RedirectHelper redirectHelper,
            OAuth2ClientRegistrationRepository clientRegistrationRepository) {
        super(commonConfig, redirectHelper, clientRegistrationRepository);
    }
}
