package com.appsmith.server.services.ce;

import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.solutions.AuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Slf4j
@RequiredArgsConstructor
public class AuthenticationValidatorCEImpl implements AuthenticationValidatorCE {

    private final AuthenticationService authenticationService;

    public Mono<DatasourceStorage> validateAuthentication(DatasourceStorage datasourceStorage) {
        if (datasourceStorage.getDatasourceConfiguration() == null
                || datasourceStorage.getDatasourceConfiguration().getAuthentication() == null) {
            return Mono.just(datasourceStorage);
        }
        AuthenticationDTO authentication =
                datasourceStorage.getDatasourceConfiguration().getAuthentication();
        return authentication
                .hasExpired()
                .filter(expired -> expired)
                .flatMap(expired -> {
                    if (authentication instanceof OAuth2) {
                        return authenticationService.refreshAuthentication(datasourceStorage);
                    }
                    return Mono.just(datasourceStorage);
                })
                .switchIfEmpty(Mono.just(datasourceStorage));
    }
}
