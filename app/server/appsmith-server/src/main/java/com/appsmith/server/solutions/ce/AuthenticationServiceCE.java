package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.OAuth2ResponseDTO;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.dtos.RequestAppsmithTokenDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;

public interface AuthenticationServiceCE {

    /**
     * This method is used by the generic OAuth2 implementation that is used by REST APIs. Here, we only populate all the required fields
     * when hitting the authorization url and redirect to it from the controller.
     *
     * @param datasourceId  required to validate the details in the request and populate redirect url
     * @param environmentId
     * @param pageId        Required to populate redirect url
     * @param httpRequest   Used to find the redirect domain
     * @return a url String to continue the authorization flow
     */
    Mono<String> getAuthorizationCodeURLForGenericOAuth2(
            String datasourceId, String environmentId, String pageId, ServerHttpRequest httpRequest);

    /**
     * This is the method that handles callback for generic OAuth2. We will be retrieving and storing token information here
     * and redirecting back to a sensible url for clients to see the response in
     *
     * @param callbackDTO OAuth2 details including short lived code and state
     * @return url for redirecting client to including a response_status
     */
    Mono<String> getAccessTokenForGenericOAuth2(AuthorizationCodeCallbackDTO callbackDTO);

    Mono<String> getAppsmithToken(
            String datasourceId,
            String environmentId,
            RequestAppsmithTokenDTO requestAppsmithTokenDTO,
            HttpHeaders headers,
            String importForGit);

    Mono<OAuth2ResponseDTO> getAccessTokenFromCloud(String datasourceId, String environmentId, String appsmithToken);

    Mono<DatasourceStorage> refreshAuthentication(DatasourceStorage datasourceStorage);
}
