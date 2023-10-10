package com.appsmith.server.authentication.oauth2clientrepositories.ce_compatible;

import com.appsmith.server.authentication.oauth2clientrepositories.BaseClientRegistrationRepository;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
public class SamlClientRepositoryCECompatibleImpl implements BaseClientRegistrationRepository {

    @Override
    public Mono<ClientRegistration> findByRegistrationId(String registrationId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
