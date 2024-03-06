package com.appsmith.server.configurations.solutions;

import com.appsmith.server.domains.UserData;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;

public interface OidcAccessTokenUpdateSolution {
    UserData getUserDataResourceForUpdatingAccessTokenAndOidcTokenIfRequired(
            UserData userData, OAuth2AuthorizedClient oidcClient);
}
