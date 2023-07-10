package com.appsmith.server.authentication.handlers;

import com.appsmith.server.authentication.handlers.ce.CustomServerOAuth2AuthorizationRequestResolverCE;
import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.helpers.RedirectHelper;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.web.server.util.matcher.PathPatternParserServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;

import java.util.Map;

public class CustomServerOAuth2AuthorizationRequestResolver extends CustomServerOAuth2AuthorizationRequestResolverCE {

    private final CommonConfig commonConfig;

    private final RedirectHelper redirectHelper;

    private final ReactiveClientRegistrationRepository clientRegistrationRepository;

    private final ServerWebExchangeMatcher authorizationRequestMatcher;

    /**
     * Creates a new instance
     *
     * @param clientRegistrationRepository the repository to resolve the {@link ClientRegistration}
     * @param commonConfig
     * @param redirectHelper
     */
    public CustomServerOAuth2AuthorizationRequestResolver(
            ReactiveClientRegistrationRepository clientRegistrationRepository,
            CommonConfig commonConfig,
            RedirectHelper redirectHelper) {
        this(
                clientRegistrationRepository,
                new PathPatternParserServerWebExchangeMatcher(DEFAULT_AUTHORIZATION_REQUEST_PATTERN),
                commonConfig,
                redirectHelper);
    }

    /**
     * Creates a new instance
     *
     * @param clientRegistrationRepository the repository to resolve the {@link ClientRegistration}
     * @param authorizationRequestMatcher  the matcher that determines if the request is a match and extracts the
     *                                     {@link #DEFAULT_REGISTRATION_ID_URI_VARIABLE_NAME} from the path variables.
     * @param redirectHelper
     */
    public CustomServerOAuth2AuthorizationRequestResolver(
            ReactiveClientRegistrationRepository clientRegistrationRepository,
            ServerWebExchangeMatcher authorizationRequestMatcher,
            CommonConfig commonConfig,
            RedirectHelper redirectHelper) {
        super(clientRegistrationRepository, authorizationRequestMatcher, commonConfig, redirectHelper);
        this.redirectHelper = redirectHelper;
        Assert.notNull(clientRegistrationRepository, "clientRegistrationRepository cannot be null");
        Assert.notNull(authorizationRequestMatcher, "authorizationRequestMatcher cannot be null");
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.authorizationRequestMatcher = authorizationRequestMatcher;
        this.commonConfig = commonConfig;
    }

    @Override
    protected void addAttributesAndAdditionalParameters(
            ClientRegistration clientRegistration,
            Map<String, Object> attributes,
            Map<String, Object> additionalParameters) {

        super.addAttributesAndAdditionalParameters(clientRegistration, attributes, additionalParameters);

        if (StringUtils.hasText(commonConfig.getOidcAudience())) {
            additionalParameters.put("audience", commonConfig.getOidcAudience());
        }

        // Add additional parameters for OIDC client with Google configurations. We need to do custom handling for
        // Google
        // IDP because Google requires additional parameters to be sent in the authorization request to return refresh
        // tokens on successful authentication.
        addAdditionalParametersForGoogleOidcClient(clientRegistration, additionalParameters);
    }

    private void addAdditionalParametersForGoogleOidcClient(
            ClientRegistration clientRegistration, Map<String, Object> additionalParameters) {
        // Check if the authorization url corresponds to Google and then add the special parameters required by Google
        // to return refresh tokens on successful authentication.
        if (clientRegistration.getRegistrationId().equals("oidc")
                && clientRegistration.getProviderDetails().getAuthorizationUri() != null
                && clientRegistration
                        .getProviderDetails()
                        .getAuthorizationUri()
                        .toLowerCase()
                        .trim()
                        .contains("google.com")) {

            additionalParameters.put("access_type", "offline");
            additionalParameters.put("prompt", "consent");
        }
    }
}
