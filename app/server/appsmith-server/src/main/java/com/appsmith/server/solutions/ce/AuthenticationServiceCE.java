package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;


public interface AuthenticationServiceCE {

    Mono<String> getAuthorizationCodeURLForGenericOauth2(String datasourceId, String pageId, ServerHttpRequest httpRequest);

    Mono<String> getAccessTokenForGenericOAuth2(AuthorizationCodeCallbackDTO callbackDTO);

    Mono<String> getAppsmithToken(String datasourceId, String pageId, ServerHttpRequest request);

    Mono<Datasource> getAccessTokenFromCloud(String datasourceId, String appsmithToken);

    Mono<Datasource> refreshAuthentication(Datasource datasource);

}
