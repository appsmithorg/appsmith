package com.appsmith.server.solutions.ce;

import com.appsmith.external.models.Datasource;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;


public interface AuthenticationServiceCE {

    /**
     * This method is used by the generic OAuth2 implementation that is used by REST APIs. Here, we only populate all the required fields
     * when hitting the authorization url and redirect to it from the controller.
     *
     * @param datasourceId required to validate the details in the request and populate redirect url
     * @param pageId       Required to populate redirect url
     * @param httpRequest  Used to find the redirect domain
     * @return a url String to continue the authorization flow
     */
    Mono<String> getAuthorizationCodeURLForGenericOauth2(String datasourceId, String pageId, ServerHttpRequest httpRequest);

    /**
     * This is the method that handles callback for generic OAuth2. We will be retrieving and storing token information here
     * and redirecting back to a sensible url for clients to see the response in
     *
     * @param callbackDTO OAuth2 details including short lived code and state
     * @return url for redirecting client to including a response_status
     */
    Mono<String> getAccessTokenForGenericOAuth2(AuthorizationCodeCallbackDTO callbackDTO);

    Mono<String> getAppsmithToken(String datasourceId, String pageId, String branchName, ServerHttpRequest request);

    Mono<Datasource> getAccessTokenFromCloud(String datasourceId, String appsmithToken);

    Mono<Datasource> refreshAuthentication(Datasource datasource);

}
