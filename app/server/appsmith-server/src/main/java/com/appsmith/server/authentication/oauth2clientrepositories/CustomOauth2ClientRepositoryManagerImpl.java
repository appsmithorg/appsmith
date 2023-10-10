package com.appsmith.server.authentication.oauth2clientrepositories;

import com.appsmith.server.authentication.oauth2clientrepositories.ce.CustomOauth2ClientRepositoryManagerCEImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class CustomOauth2ClientRepositoryManagerImpl extends CustomOauth2ClientRepositoryManagerCEImpl
        implements CustomOauth2ClientRepositoryManager {

    private final OidcClientRepositoryImpl oidcClientRepository;
    private final SamlClientRepositoryImpl samlClientRepository;

    @Override
    public BaseClientRegistrationRepository findClientRegistrationRepositoryByRegistrationId(String registrationId) {

        if (!StringUtils.hasLength(registrationId)) {
            return null;
        }
        switch (registrationId) {
            case "oidc" -> {
                return oidcClientRepository;
            }
            case "keycloak" -> {
                return samlClientRepository;
            }
            default -> {
                return null;
            }
        }
    }
}
