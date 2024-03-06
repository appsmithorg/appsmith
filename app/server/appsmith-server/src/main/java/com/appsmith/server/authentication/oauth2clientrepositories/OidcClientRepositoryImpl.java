package com.appsmith.server.authentication.oauth2clientrepositories;

import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.authentication.oauth2clientrepositories.ce_compatible.OidcClientRepositoryCECompatibleImpl;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
@Primary
public class OidcClientRepositoryImpl extends OidcClientRepositoryCECompatibleImpl
        implements BaseClientRegistrationRepository {

    private final ReactiveClientRegistrationRepository clientRegistrationRepository;

    @FeatureFlagged(featureFlagName = FeatureFlagEnum.license_sso_oidc_enabled)
    @Override
    public Mono<ClientRegistration> findByRegistrationId(String registrationId) {
        return this.clientRegistrationRepository.findByRegistrationId(registrationId);
    }
}
