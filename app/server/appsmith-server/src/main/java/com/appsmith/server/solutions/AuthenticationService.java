package com.appsmith.server.solutions;

import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewPageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.internal.Base64;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Instant;
import java.util.Map;

import static com.appsmith.external.constants.Authentication.ACCESS_TOKEN;
import static com.appsmith.external.constants.Authentication.AUTHORIZATION_CODE;
import static com.appsmith.external.constants.Authentication.CLIENT_ID;
import static com.appsmith.external.constants.Authentication.CLIENT_SECRET;
import static com.appsmith.external.constants.Authentication.CODE;
import static com.appsmith.external.constants.Authentication.EXPIRES_IN;
import static com.appsmith.external.constants.Authentication.GRANT_TYPE;
import static com.appsmith.external.constants.Authentication.REDIRECT_URI;
import static com.appsmith.external.constants.Authentication.REFRESH_TOKEN;
import static com.appsmith.external.constants.Authentication.RESPONSE_TYPE;
import static com.appsmith.external.constants.Authentication.SCOPE;
import static com.appsmith.external.constants.Authentication.STATE;
import static com.appsmith.external.constants.Authentication.SUCCESS;


@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final DatasourceService datasourceService;

    private final RedirectHelper redirectHelper;

    private final NewPageService newPageService;

    public Mono<String> getAuthorizationCodeURL(String datasourceId, String pageId, ServerHttpRequest httpRequest) {
        // This is the only database access that is controlled by ACL
        // The rest of the queries in this flow will not have context information
        return datasourceService.findById(datasourceId, AclPermission.MANAGE_DATASOURCES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(this::validateRequiredFields)
                .flatMap((datasource -> {
                    OAuth2 oAuth2 = (OAuth2) datasource.getDatasourceConfiguration().getAuthentication();
                    final String redirectUri = redirectHelper.getRedirectDomain(httpRequest.getHeaders());
                    // Adding basic uri components
                    UriComponentsBuilder uriComponentsBuilder = UriComponentsBuilder
                            .fromUriString(oAuth2.getAuthorizationUrl())
                            .queryParam(CLIENT_ID, oAuth2.getClientId())
                            .queryParam(RESPONSE_TYPE, CODE)
                            .queryParam(REDIRECT_URI, redirectUri + Url.DATASOURCE_URL + "/authorize")
                            // The state is used internally to calculate the redirect url when returning control to the client
                            .queryParam(STATE, String.join(",", pageId, datasourceId, redirectUri));
                    // Adding optional scope parameter
                    if (oAuth2.getScope() != null && !oAuth2.getScope().isEmpty()) {
                        uriComponentsBuilder
                                .queryParam(SCOPE, String.join(",", oAuth2.getScope()));
                    }
                    // Adding additional user-defined parameters, these would be authorization server specific
                    if (oAuth2.getCustomAuthenticationParameters() != null) {
                        oAuth2.getCustomAuthenticationParameters().forEach(x ->
                                uriComponentsBuilder.queryParam(x.getKey(), x.getValue())
                        );
                    }

                    return Mono.just(uriComponentsBuilder.toUriString());
                }));
    }

    private Mono<Datasource> validateRequiredFields(Datasource datasource) {
        // Since validation takes take of checking for fields that are present
        // We just need to make sure that the datasource has the right authentication type
        if (datasource.getDatasourceConfiguration() == null || !(datasource.getDatasourceConfiguration().getAuthentication() instanceof OAuth2)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "authentication"));
        }

        return datasourceService.validateDatasource(datasource)
                .flatMap(datasource1 -> {
                    if (!datasource1.getIsValid()) {
                        return Mono.error(new AppsmithException(AppsmithError.VALIDATION_FAILURE, datasource1.getInvalids().iterator().next()));
                    }
                    return Mono.just(datasource1);
                });
    }

    public Mono<String> getAccessToken(AuthorizationCodeCallbackDTO callbackDTO) {
        final String error = callbackDTO.getError();
        String code = callbackDTO.getCode();
        final String state = callbackDTO.getState();
        String scope = callbackDTO.getScope();
        // If there is an error code, return with that code to the client
        if (!StringUtils.isEmpty(error)) {
            return this.getPageRedirectUrl(state, error);
        }
        // Otherwise, proceed to retrieve the access token from the authorization server
        return Mono.justOrEmpty(state)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS)))
                .flatMap(localState -> {
                    if (localState.split(",").length != 3) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    } else
                        return Mono.just(localState.split(",")[1]);
                })
                .flatMap(datasourceService::getById)
                .flatMap(datasource -> {
                    OAuth2 oAuth2 = (OAuth2) datasource.getDatasourceConfiguration().getAuthentication();
                    WebClient.Builder builder = WebClient.builder();
                    builder
                            .baseUrl(oAuth2.getAccessTokenUrl())
                            .clientConnector(new ReactorClientHttpConnector(
                                    HttpClient.create().wiretap(true)
                            ));

                    MultiValueMap<String, String> map = new LinkedMultiValueMap<>();

                    // Add required fields
                    map.add(GRANT_TYPE, AUTHORIZATION_CODE);
                    map.add(CODE, code);
                    map.add(REDIRECT_URI, state.split(",")[2] + Url.DATASOURCE_URL + "/authorize");
                    if (!oAuth2.getScope().isEmpty()) {
                        map.add(SCOPE, String.join(",", oAuth2.getScope()));
                    }

                    // Add client credentials to header or body, as configured
                    if (Boolean.FALSE.equals(oAuth2.getIsAuthorizationHeader())) {
                        map.add(CLIENT_ID, oAuth2.getClientId());
                        map.add(CLIENT_SECRET, oAuth2.getClientSecret());
                    } else if (Boolean.TRUE.equals(oAuth2.getIsAuthorizationHeader())) {
                        byte[] clientCredentials = (oAuth2.getClientId() + ":" + oAuth2.getClientSecret()).getBytes();
                        final String authorizationHeader = "Basic " + Base64.encode(clientCredentials);
                        builder.defaultHeader("Authorization", authorizationHeader);
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "isAuthorizationHeader"));
                    }
                    return builder.build()
                            .method(HttpMethod.POST)
                            .body(BodyInserters.fromFormData(map))
                            .exchange()
                            .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    oAuth2.setIsAuthorized(true);
                                    return response.bodyToMono(Map.class);
                                } else {
                                    log.debug("Unable to retrieve access token for datasource {} with error {}", datasource.getId(), response.statusCode());
                                    return Mono.error(new AppsmithException(AppsmithError.INVALID_DATASOURCE_CONFIGURATION));
                                }
                            })
                            .flatMap(response -> {
                                AuthenticationResponse authenticationResponse = new AuthenticationResponse();
                                authenticationResponse.setTokenResponse(response);
                                authenticationResponse.setToken((String) response.get(ACCESS_TOKEN));
                                authenticationResponse.setRefreshToken((String) response.get(REFRESH_TOKEN));
                                authenticationResponse.setExpiresAt(Instant.now().plusSeconds(Long.valueOf((Integer) response.get(EXPIRES_IN))));
                                oAuth2.setAuthenticationResponse(authenticationResponse);
                                oAuth2.setIsEncrypted(null);
                                datasource.getDatasourceConfiguration().setAuthentication(oAuth2);
                                return datasourceService.update(datasource.getId(), datasource);
                            });
                })
                // We have no use of the datasource object during redirection, we merely send the response as a success state
                .flatMap((datasource -> this.getPageRedirectUrl(state, null)))
                .onErrorResume(
                        e -> !(AppsmithError.UNAUTHORIZED_ACCESS.equals(((AppsmithException) e).getError())),
                        e -> {
                            log.debug("Error while retrieving access token: ", e);
                            return this.getPageRedirectUrl(state, "appsmith_error");
                        });
    }

    private Mono<String> getPageRedirectUrl(String state, String error) {
        final String[] splitState = state.split(",");

        final String pageId = splitState[0];
        final String datasourceId = splitState[1];
        final String redirectOrigin = splitState[2];
        String response = SUCCESS;
        if (error != null) {
            response = error;
        }
        final String responseStatus = response;
        return newPageService.getById(pageId)
                .map(newPage -> {
                    return redirectOrigin + Entity.SLASH +
                            Entity.APPLICATIONS + Entity.SLASH +
                            newPage.getApplicationId() + Entity.SLASH +
                            Entity.PAGES + Entity.SLASH +
                            newPage.getId() + Entity.SLASH +
                            "edit" + Entity.SLASH +
                            Entity.DATASOURCES + Entity.SLASH +
                            datasourceId + Entity.SLASH +
                            "?response_status=" + responseStatus;
                })
                .onErrorResume(e -> {
                    return Mono.just(
                            redirectOrigin + Entity.SLASH +
                                    Entity.APPLICATIONS +
                                    "?response_status=" + responseStatus);
                });
    }

}
