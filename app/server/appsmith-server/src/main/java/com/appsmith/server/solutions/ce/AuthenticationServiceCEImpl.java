package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.OAuth2;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.PluginType;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.dtos.IntegrationDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PluginService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.internal.Base64;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.Map;

import static com.appsmith.external.constants.Authentication.ACCESS_TOKEN;
import static com.appsmith.external.constants.Authentication.AUDIENCE;
import static com.appsmith.external.constants.Authentication.AUTHORIZATION_CODE;
import static com.appsmith.external.constants.Authentication.CLIENT_ID;
import static com.appsmith.external.constants.Authentication.CLIENT_SECRET;
import static com.appsmith.external.constants.Authentication.CODE;
import static com.appsmith.external.constants.Authentication.GRANT_TYPE;
import static com.appsmith.external.constants.Authentication.REDIRECT_URI;
import static com.appsmith.external.constants.Authentication.REFRESH_TOKEN;
import static com.appsmith.external.constants.Authentication.RESOURCE;
import static com.appsmith.external.constants.Authentication.RESPONSE_TYPE;
import static com.appsmith.external.constants.Authentication.SCOPE;
import static com.appsmith.external.constants.Authentication.STATE;
import static com.appsmith.external.constants.Authentication.SUCCESS;


@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceCEImpl implements AuthenticationServiceCE {

    private final DatasourceService datasourceService;

    private final PluginService pluginService;

    private final RedirectHelper redirectHelper;

    private final NewPageService newPageService;

    private final CloudServicesConfig cloudServicesConfig;

    private final ConfigService configService;

    /**
     * This method is used by the generic OAuth2 implementation that is used by REST APIs. Here, we only populate all the required fields
     * when hitting the authorization url and redirect to it from the controller.
     *
     * @param datasourceId required to validate the details in the request and populate redirect url
     * @param pageId       Required to populate redirect url
     * @param httpRequest  Used to find the redirect domain
     * @return a url String to continue the authorization flow
     */
    public Mono<String> getAuthorizationCodeURLForGenericOauth2(String datasourceId, String pageId, ServerHttpRequest httpRequest) {
        // This is the only database access that is controlled by ACL
        // The rest of the queries in this flow will not have context information
        return datasourceService.findById(datasourceId, AclPermission.MANAGE_DATASOURCES)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(this::validateRequiredFieldsForGenericOAuth2)
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
                                .queryParam(SCOPE, StringUtils.collectionToDelimitedString(oAuth2.getScope(), " "));
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

    private Mono<Datasource> validateRequiredFieldsForGenericOAuth2(Datasource datasource) {
        // Since validation takes care of checking for fields that are present
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

    /**
     * This is the method that handles callback for generic OAuth2. We will be retrieving and storing token information here
     * and redirecting back to a sensible url for clients to see the response in
     *
     * @param callbackDTO OAuth2 details including short lived code and state
     * @return url for redirecting client to including a response_status
     */
    public Mono<String> getAccessTokenForGenericOAuth2(AuthorizationCodeCallbackDTO callbackDTO) {
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
                    WebClient.Builder builder = WebClient.builder().baseUrl(oAuth2.getAccessTokenUrl());

                    MultiValueMap<String, String> map = new LinkedMultiValueMap<>();

                    // Add required fields
                    map.add(GRANT_TYPE, AUTHORIZATION_CODE);
                    map.add(CODE, code);
                    map.add(REDIRECT_URI, state.split(",")[2] + Url.DATASOURCE_URL + "/authorize");
                    // We use the returned scope instead because users may have authorized fewer scopes than requested
                    if (scope != null && !scope.isBlank()) {
                        map.add(SCOPE, scope);
                    }

                    // Add client credentials to header or body, as configured
                    if (Boolean.FALSE.equals(oAuth2.getIsAuthorizationHeader())) {
                        map.add(CLIENT_ID, oAuth2.getClientId());
                        map.add(CLIENT_SECRET, oAuth2.getClientSecret());
                        // Adding optional audience parameter
                        if (!StringUtils.isEmpty(oAuth2.getAudience())) {
                            map.add(AUDIENCE, oAuth2.getAudience());
                        }
                        // Adding optional resource parameter
                        if (!StringUtils.isEmpty(oAuth2.getResource())) {
                            map.add(RESOURCE, oAuth2.getResource());
                        }
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
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INTERNAL_SERVER_ERROR,
                                            "Unable to retrieve access token for datasource {} with error {}", datasource.getId(), response.statusCode()));
                                }
                            })
                            .flatMap(response -> {
                                AuthenticationResponse authenticationResponse = new AuthenticationResponse();
                                authenticationResponse.setTokenResponse(response);
                                authenticationResponse.setToken((String) response.get(ACCESS_TOKEN));
                                authenticationResponse.setRefreshToken((String) response.get(REFRESH_TOKEN));
                                // Parse useful fields for quick access
                                Object issuedAtResponse = response.get(Authentication.ISSUED_AT);
                                // Default issuedAt to current time
                                Instant issuedAt = Instant.now();
                                if (issuedAtResponse != null) {
                                    issuedAt = Instant.ofEpochMilli(Long.parseLong((String) issuedAtResponse));
                                }
                                // We expect at least one of the following to be present
                                Object expiresAtResponse = response.get(Authentication.EXPIRES_AT);
                                Object expiresInResponse = response.get(Authentication.EXPIRES_IN);
                                Instant expiresAt = null;
                                if (expiresAtResponse != null) {
                                    expiresAt = Instant.ofEpochSecond(Long.valueOf((Integer) expiresAtResponse));
                                } else if (expiresInResponse != null) {
                                    expiresAt = issuedAt.plusSeconds(Long.valueOf((Integer) expiresInResponse));

                                }
                                authenticationResponse.setExpiresAt(expiresAt);
                                // Replacing with returned scope instead
                                if (scope != null && !scope.isBlank()) {
                                    oAuth2.setScopeString(String.join(",", scope.split(" ")));
                                } else {
                                    oAuth2.setScopeString("");
                                }
                                oAuth2.setAuthenticationResponse(authenticationResponse);
                                datasource.getDatasourceConfiguration().setAuthentication(oAuth2);
                                return datasourceService.update(datasource.getId(), datasource);
                            });
                })
                // We have no use of the datasource object during redirection, we merely send the response as a success state
                .flatMap((datasource -> this.getPageRedirectUrl(state, null)))
                .onErrorResume(
                        e -> !(e instanceof AppsmithException
                                && AppsmithError.UNAUTHORIZED_ACCESS.equals(((AppsmithException) e).getError())),
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
                .map(newPage -> redirectOrigin + Entity.SLASH +
                        Entity.APPLICATIONS + Entity.SLASH +
                        newPage.getApplicationId() + Entity.SLASH +
                        Entity.PAGES + Entity.SLASH +
                        newPage.getId() + Entity.SLASH +
                        "edit" + Entity.SLASH +
                        Entity.DATASOURCES + Entity.SLASH +
                        datasourceId +
                        "?response_status=" + responseStatus +
                        "&view_mode=true")
                .onErrorResume(e -> Mono.just(
                        redirectOrigin + Entity.SLASH +
                                Entity.APPLICATIONS +
                                "?response_status=" + responseStatus +
                                "&view_mode=true"));
    }

    public Mono<String> getAppsmithToken(String datasourceId, String pageId, String branchName, ServerHttpRequest request) {
        // Check whether user has access to manage the datasource
        // Validate the datasource according to plugin type as well
        // If successful, then request for appsmithToken
        // Set datasource state to intermediate stage
        // Return the appsmithToken to client
        Mono<Datasource> datasourceMono = datasourceService
                .findById(datasourceId, AclPermission.MANAGE_DATASOURCES)
                .cache();

        final String redirectUri = redirectHelper.getRedirectDomain(request.getHeaders());

        return datasourceMono
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(this::validateRequiredFieldsForGenericOAuth2)
                .flatMap(datasource -> Mono.zip(
                            newPageService.findById(pageId, AclPermission.READ_PAGES),
                            configService.getInstanceId(),
                            pluginService.findById(datasource.getPluginId()))
                        .map(tuple -> {
                            IntegrationDTO integrationDTO = new IntegrationDTO();
                            integrationDTO.setInstallationKey(tuple.getT2());
                            NewPage page = tuple.getT1();

                            DefaultResources defaultResourceIds = page.getDefaultResources();
                            String defaultPageId = StringUtils.hasLength(defaultResourceIds.getPageId())
                                    ? defaultResourceIds.getPageId()
                                    : page.getId();

                            String defaultApplicationId = StringUtils.hasLength(defaultResourceIds.getApplicationId())
                                    ? defaultResourceIds.getApplicationId()
                                    : page.getApplicationId();

                            integrationDTO.setPageId(defaultPageId);
                            integrationDTO.setApplicationId(defaultApplicationId);
                            integrationDTO.setBranch(branchName);
                            final Plugin plugin = tuple.getT3();
                            integrationDTO.setPluginName(plugin.getPluginName());
                            integrationDTO.setPluginVersion(plugin.getVersion());
                            // TODO add authenticationDTO
                            integrationDTO.setDatasourceId(datasourceId);
                            integrationDTO.setScope(((OAuth2) datasource.getDatasourceConfiguration().getAuthentication()).getScope());
                            integrationDTO.setRedirectionDomain(redirectUri);
                            return integrationDTO;
                        }))
                .flatMap(integrationDTO -> {
                    WebClient.Builder builder = WebClient.builder();
                    builder.baseUrl(cloudServicesConfig.getBaseUrl() + "/api/v1/integrations/oauth/appsmith");
                    return builder.build()
                            .method(HttpMethod.POST)
                            .body(BodyInserters.fromValue(integrationDTO))
                            .exchange()
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    return response.bodyToMono(Map.class);
                                } else {
                                    log.debug("Unable to retrieve appsmith token with error {}", response.statusCode());
                                    return Mono.error(new AppsmithException(AppsmithError.AUTHENTICATION_FAILURE,
                                            "Unable to retrieve appsmith token with error " + response.statusCode()));
                                }
                            })
                            .map(body -> String.valueOf(body.get("data")))
                            .zipWith(datasourceMono)
                            .flatMap(tuple -> {
                                String appsmithToken = tuple.getT1();
                                Datasource datasource = tuple.getT2();
                                datasource
                                        .getDatasourceConfiguration()
                                        .getAuthentication()
                                        .setAuthenticationStatus(AuthenticationDTO.AuthenticationStatus.IN_PROGRESS);
                                return datasourceService.update(datasource.getId(), datasource).thenReturn(appsmithToken);
                            })
                            .onErrorMap(ConnectException.class,
                                    error -> new AppsmithException(
                                            AppsmithError.AUTHENTICATION_FAILURE,
                                            "Unable to connect to Appsmith authentication server."
                                    ));
                });
    }

    public Mono<Datasource> getAccessTokenFromCloud(String datasourceId, String appsmithToken) {
        // Check if user has access to manage datasource
        // If yes, check if datasource is in intermediate state
        // If yes, request for token and store in datasource
        // Update datasource as being authorized
        // Return control to client
        Mono<Datasource> datasourceMono = datasourceService
                .findById(datasourceId, AclPermission.MANAGE_DATASOURCES)
                .cache();

        return datasourceMono
                .filter(datasource -> AuthenticationDTO.AuthenticationStatus.IN_PROGRESS.equals(datasource.getDatasourceConfiguration().getAuthentication().getAuthenticationStatus()))
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(this::validateRequiredFieldsForGenericOAuth2)
                .flatMap(datasource -> {
                    WebClient.Builder builder = WebClient.builder();
                    UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
                    try {
                        uriBuilder.uri(new URI(cloudServicesConfig.getBaseUrl() + "/api/v1/integrations/oauth/token"))
                                .queryParam("appsmithToken", appsmithToken);
                    } catch (URISyntaxException e) {
                        log.debug("Error while parsing access token URL.", e);
                    }
                    return builder.build()
                            .method(HttpMethod.POST)
                            .uri(uriBuilder.build(true).toUri())
                            .exchange()
                            .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    return response.bodyToMono(AuthenticationResponse.class);
                                } else {
                                    log.debug("Unable to retrieve appsmith token with error {}", response.statusCode());
                                    return Mono.error(new AppsmithException(AppsmithError.AUTHENTICATION_FAILURE,
                                            "Unable to retrieve appsmith token with error " + response.statusCode()));
                                }
                            })
                            .flatMap(authenticationResponse -> {
                                datasource
                                        .getDatasourceConfiguration()
                                        .getAuthentication()
                                        .setAuthenticationStatus(AuthenticationDTO.AuthenticationStatus.SUCCESS);
                                OAuth2 oAuth2 = (OAuth2) datasource.getDatasourceConfiguration().getAuthentication();
                                oAuth2.setAuthenticationResponse(authenticationResponse);
                                datasource.getDatasourceConfiguration().setAuthentication(oAuth2);
                                return Mono.just(datasource);
                            });
                })
                .flatMap(datasource -> datasourceService.update(datasource.getId(), datasource))
                .onErrorMap(ConnectException.class,
                        error -> new AppsmithException(
                                AppsmithError.AUTHENTICATION_FAILURE,
                                "Unable to connect to Appsmith authentication server."
                        ));
    }

    public Mono<Datasource> refreshAuthentication(Datasource datasource) {
        // This method will always be called from a point where these validations have been performed
        assert (datasource != null &&
                datasource.getDatasourceConfiguration() != null &&
                datasource.getDatasourceConfiguration().getAuthentication() instanceof OAuth2);
        OAuth2 oAuth2 = (OAuth2) datasource.getDatasourceConfiguration().getAuthentication();
        return pluginService.findById(datasource.getPluginId())
                .filter(plugin -> PluginType.SAAS.equals(plugin.getType()) || PluginType.REMOTE.equals(plugin.getType()))
                .zipWith(configService.getInstanceId())
                .flatMap(tuple -> {
                    Plugin plugin = tuple.getT1();
                    String installationKey = tuple.getT2();
                    IntegrationDTO integrationDTO = new IntegrationDTO();
                    integrationDTO.setInstallationKey(installationKey);
                    integrationDTO.setAuthenticationResponse(oAuth2.getAuthenticationResponse());
                    integrationDTO.setScope(oAuth2.getScope());
                    integrationDTO.setPluginName(plugin.getPluginName());
                    integrationDTO.setPluginVersion(plugin.getVersion());

                    WebClient.Builder builder = WebClient
                            .builder()
                            .baseUrl(cloudServicesConfig.getBaseUrl() + "/api/v1/integrations/oauth/refresh");

                    return builder.build()
                            .method(HttpMethod.POST)
                            .body(BodyInserters.fromValue(integrationDTO))
                            .exchange()
                            .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    return response.bodyToMono(AuthenticationResponse.class);
                                } else {
                                    log.debug("Unable to retrieve appsmith token with error {}", response.statusCode());
                                    return Mono.error(new AppsmithException(AppsmithError.AUTHENTICATION_FAILURE,
                                            response.statusCode()));
                                }
                            })
                            .flatMap(authenticationResponse -> {
                                oAuth2.setAuthenticationResponse(authenticationResponse);
                                datasource.getDatasourceConfiguration().setAuthentication(oAuth2);
                                // We return the same object instead of the update value because the updates value
                                // will be in the encrypted form
                                return datasourceService
                                        .update(datasource.getId(), datasource)
                                        .thenReturn(datasource);
                            });
                })
                .switchIfEmpty(Mono.just(datasource))
                .onErrorMap(ConnectException.class,
                        error -> new AppsmithException(
                                AppsmithError.AUTHENTICATION_FAILURE,
                                "Unable to connect to Appsmith authentication server."
                        ));
    }
}
