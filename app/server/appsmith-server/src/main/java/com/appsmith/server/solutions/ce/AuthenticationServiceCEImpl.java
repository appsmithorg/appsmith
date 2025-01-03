package com.appsmith.server.solutions.ce;

import com.appsmith.external.constants.Authentication;
import com.appsmith.external.exceptions.BaseException;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.helpers.SSLHelper;
import com.appsmith.external.helpers.restApiUtils.helpers.OAuth2Utils;
import com.appsmith.external.models.AuthenticationDTO;
import com.appsmith.external.models.AuthenticationResponse;
import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.models.OAuth2ResponseDTO;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.Entity;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Config;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.AuthorizationCodeCallbackDTO;
import com.appsmith.server.dtos.IntegrationDTO;
import com.appsmith.server.dtos.RequestAppsmithTokenDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.InstanceConfigHelper;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PagePermission;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.net.ConnectException;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

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
import static org.springframework.util.StringUtils.hasText;

@RequiredArgsConstructor
@Slf4j
public class AuthenticationServiceCEImpl implements AuthenticationServiceCE {

    private final DatasourceService datasourceService;
    private final PluginService pluginService;
    private final RedirectHelper redirectHelper;
    private final NewPageService newPageService;
    private final CloudServicesConfig cloudServicesConfig;
    private final ConfigService configService;
    private final DatasourcePermission datasourcePermission;
    private final PagePermission pagePermission;
    private final PluginExecutorHelper pluginExecutorHelper;
    private final DatasourceStorageService datasourceStorageService;
    private final InstanceConfigHelper instanceConfigHelper;
    private static final String FILE_SPECIFIC_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
    private static final String ACCESS_TOKEN_KEY = "access_token";

    /**
     * This method is used by the generic OAuth2 implementation that is used by REST APIs. Here, we only populate all the required fields
     * when hitting the authorization url and redirect to it from the controller.
     *
     * @param datasourceId  required to validate the details in the request and populate redirect url
     * @param environmentId environment from which the datasource authentication has started.
     * @param branchedPageId required to populate redirect url
     * @param httpRequest   used to find the redirect domain
     * @return a url String to continue the authorization flow
     */
    public Mono<String> getAuthorizationCodeURLForGenericOAuth2(
            String datasourceId, String environmentId, String branchedPageId, ServerHttpRequest httpRequest) {
        // This is the only database access that is controlled by ACL
        // The rest of the queries in this flow will not have context information

        Mono<Datasource> datasourceMonoCached = datasourceService
                .findById(datasourceId, datasourcePermission.getEditPermission())
                .cache();

        Mono<String> trueEnvironmentIdCached = datasourceMonoCached
                .flatMap(datasource -> datasourceService.getTrueEnvironmentId(
                        datasource.getWorkspaceId(), environmentId, datasource.getPluginId(), null))
                .cache();

        Mono<NewPage> newPageMono = newPageService
                .findById(branchedPageId, pagePermission.getReadPermission())
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.PAGE, branchedPageId)));

        Mono<String> workspaceIdMono = datasourceMonoCached.map(Datasource::getWorkspaceId);

        return datasourceMonoCached
                .zipWith(trueEnvironmentIdCached)
                .flatMap(tuple2 -> {
                    Datasource datasource = tuple2.getT1();
                    String trueEnvironmentId = tuple2.getT2();
                    return datasourceStorageService.findByDatasourceAndEnvironmentId(datasource, trueEnvironmentId);
                })
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(ds -> this.validateRequiredFieldsForGenericOAuth2(ds)
                        .zipWith(Mono.zip(workspaceIdMono, trueEnvironmentIdCached, newPageMono)))
                .flatMap(tuple2 -> {
                    DatasourceStorage datasourceStorage = tuple2.getT1();
                    String workspaceId = tuple2.getT2().getT1();
                    String trueEnvironmentId = tuple2.getT2().getT2();
                    NewPage branchedPage = tuple2.getT2().getT3();
                    String refName = null;
                    RefType refType = null;

                    if (hasText(branchedPage.getRefName())) {
                        refType = branchedPage.getRefType();
                        refName = branchedPage.getRefName();
                    }
                    String basePageId = branchedPage.getBaseIdOrFallback();

                    OAuth2 oAuth2 = (OAuth2)
                            datasourceStorage.getDatasourceConfiguration().getAuthentication();
                    final String redirectUri = redirectHelper.getRedirectDomain(httpRequest.getHeaders());
                    final String state = StringUtils.hasText(refName)
                            ? String.join(
                                    ",",
                                    basePageId,
                                    datasourceId,
                                    trueEnvironmentId,
                                    redirectUri,
                                    workspaceId,
                                    refType.name(),
                                    refName)
                            : String.join(",", basePageId, datasourceId, trueEnvironmentId, redirectUri, workspaceId);
                    // Adding basic uri components
                    UriComponentsBuilder uriComponentsBuilder = UriComponentsBuilder.fromUriString(
                                    oAuth2.getAuthorizationUrl())
                            .queryParam(CLIENT_ID, oAuth2.getClientId())
                            .queryParam(RESPONSE_TYPE, CODE)
                            .queryParam(REDIRECT_URI, redirectUri + Url.DATASOURCE_URL + "/authorize")
                            // The state is used internally to calculate the redirect url when returning control to the
                            // client
                            .queryParam(STATE, state);
                    // Adding optional scope parameter
                    if (oAuth2.getScope() != null && !oAuth2.getScope().isEmpty()) {
                        uriComponentsBuilder.queryParam(
                                SCOPE, StringUtils.collectionToDelimitedString(oAuth2.getScope(), " "));
                    }
                    // Adding additional user-defined parameters, these would be authorization server specific
                    if (oAuth2.getCustomAuthenticationParameters() != null) {
                        oAuth2.getCustomAuthenticationParameters()
                                .forEach(x -> uriComponentsBuilder.queryParam(x.getKey(), x.getValue()));
                    }

                    return Mono.just(uriComponentsBuilder.toUriString());
                });
    }

    private Mono<DatasourceStorage> validateRequiredFieldsForGenericOAuth2(DatasourceStorage datasourceStorage) {
        // Since validation takes care of checking for fields that are present
        // We just need to make sure that the datasource has the right authentication type
        if (datasourceStorage.getDatasourceConfiguration() == null
                || !(datasourceStorage.getDatasourceConfiguration().getAuthentication() instanceof OAuth2)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "authentication"));
        }

        return datasourceStorageService
                .validateDatasourceStorage(datasourceStorage)
                .flatMap(datasourceStorage1 -> {
                    if (!datasourceStorage1.getIsValid()) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.VALIDATION_FAILURE,
                                datasourceStorage1.getInvalids().iterator().next()));
                    }
                    return Mono.just(datasourceStorage1);
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
                    String[] splitStates = localState.split(",");
                    if (splitStates.length < 4) {
                        return Mono.error(new AppsmithException(AppsmithError.UNAUTHORIZED_ACCESS));
                    } else
                        return datasourceService
                                .findById(splitStates[1])
                                .flatMap(datasource1 -> datasourceStorageService.findByDatasourceAndEnvironmentId(
                                        datasource1, splitStates[2]));
                })
                .flatMap(datasourceStorage -> {
                    OAuth2 oAuth2 = (OAuth2)
                            datasourceStorage.getDatasourceConfiguration().getAuthentication();
                    final HttpClient httpClient = HttpClient.create();

                    if (oAuth2.isUseSelfSignedCert()) {
                        httpClient.secure(
                                SSLHelper.sslCheckForHttpClient(datasourceStorage.getDatasourceConfiguration()));
                    }

                    WebClient.Builder builder =
                            WebClientUtils.builder(httpClient).baseUrl(oAuth2.getAccessTokenUrl());

                    MultiValueMap<String, String> map = new LinkedMultiValueMap<>();

                    // Add required fields
                    map.add(GRANT_TYPE, AUTHORIZATION_CODE);
                    map.add(CODE, code);
                    map.add(REDIRECT_URI, state.split(",")[3] + Url.DATASOURCE_URL + "/authorize");
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
                        final String authorizationHeader =
                                "Basic " + Base64.getEncoder().encodeToString(clientCredentials);
                        builder.defaultHeader("Authorization", authorizationHeader);
                    } else {
                        return Mono.error(
                                new AppsmithException(AppsmithError.INVALID_PARAMETER, "isAuthorizationHeader"));
                    }
                    return builder.build()
                            .method(HttpMethod.POST)
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                            .body(BodyInserters.fromFormData(map))
                            .exchange()
                            .doOnError(
                                    e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    oAuth2.setIsAuthorized(true);
                                    return response.bodyToMono(Map.class);
                                } else {
                                    log.debug(
                                            "Unable to retrieve access token for datasource {} with error {}",
                                            datasourceStorage.getId(),
                                            response.statusCode());
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.INTERNAL_SERVER_ERROR,
                                            "Unable to retrieve access token for datasource {} with error {}",
                                            datasourceStorage.getId(),
                                            response.statusCode()));
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
                                Instant expiresAt = OAuth2Utils.getAuthenticationExpiresAt(oAuth2, response, issuedAt);
                                authenticationResponse.setExpiresAt(expiresAt);
                                // Replacing with returned scope instead
                                if (scope != null && !scope.isBlank()) {
                                    oAuth2.setScopeString(String.join(",", scope.split(" ")));
                                } else {
                                    oAuth2.setScopeString("");
                                }
                                oAuth2.setAuthenticationResponse(authenticationResponse);
                                datasourceStorage.getDatasourceConfiguration().setAuthentication(oAuth2);
                                return datasourceStorageService.save(datasourceStorage);
                            });
                })
                // We have no use of the datasource object during redirection, we merely send the response as a success
                // state
                .flatMap((datasource -> this.getPageRedirectUrl(state, null)))
                .onErrorResume(
                        e -> !(e instanceof AppsmithException
                                && AppsmithError.UNAUTHORIZED_ACCESS.equals(((AppsmithException) e).getError())),
                        e -> {
                            log.debug("Error while retrieving access token: ", e);
                            return this.getPageRedirectUrl(state, "appsmith_error");
                        }); // */
    }

    private Mono<String> getPageRedirectUrl(String state, String error) {
        final String[] splitState = state.split(",");

        final String basePageId = splitState[0];
        final String datasourceId = splitState[1];
        final String environmentId = splitState[2];
        final String redirectOrigin = splitState[3];
        final String workspaceId = splitState[4];
        final String refName = splitState.length == 7 ? splitState[6] : null;
        String response = SUCCESS;
        if (error != null) {
            response = error;
        }
        final String responseStatus = response;
        return newPageService
                .findById(basePageId, pagePermission.getReadPermission())
                .map(basePage -> {
                    return redirectOrigin + Entity.SLASH + Entity.APPLICATIONS
                            + Entity.SLASH + basePage.getApplicationId()
                            + Entity.SLASH + Entity.PAGES
                            + Entity.SLASH + basePage.getId()
                            + Entity.SLASH + "edit"
                            + Entity.SLASH + Entity.DATASOURCE
                            + Entity.SLASH + datasourceId
                            + "?response_status="
                            + responseStatus
                            + "&view_mode=true"
                            + (StringUtils.hasText(workspaceId) ? "&workspaceId=" + workspaceId : "")
                            + (StringUtils.hasText(refName) ? "&branch=" + refName : "");
                })
                .onErrorResume(e -> Mono.just(redirectOrigin + Entity.SLASH + Entity.APPLICATIONS
                        + "?response_status="
                        + responseStatus + "&view_mode=true")); // */
    }

    @Override
    public Mono<String> getAppsmithToken(
            String datasourceId,
            String environmentId,
            RequestAppsmithTokenDTO requestAppsmithTokenDTO,
            HttpHeaders headers,
            String importForGit) {
        // Check whether user has access to manage the datasource
        // Validate the datasource according to plugin type as well
        // If successful, then request for appsmithToken
        // Set datasource state to intermediate stage
        // Return the appsmithToken to client

        Mono<Datasource> datasourceMonoCached = datasourceService
                .findById(datasourceId, datasourcePermission.getEditPermission())
                .cache();

        Mono<String> trueEnvironmentIdCached = datasourceMonoCached
                .flatMap(datasource -> datasourceService.getTrueEnvironmentId(
                        datasource.getWorkspaceId(), environmentId, datasource.getPluginId(), null))
                .cache();

        Mono<DatasourceStorage> datasourceStorageMonoCached = datasourceMonoCached
                .zipWith(trueEnvironmentIdCached)
                .flatMap(tuple2 -> {
                    Datasource datasource = tuple2.getT1();
                    String trueEnvironmentId = tuple2.getT2();
                    return datasourceStorageService.findByDatasourceAndEnvironmentId(datasource, trueEnvironmentId);
                });

        final String redirectUri = redirectHelper.getRedirectDomain(headers);

        return datasourceStorageMonoCached
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(this::validateRequiredFieldsForGenericOAuth2)
                .flatMap(datasource -> Mono.zip(
                                configService.getInstanceId(), pluginService.findById(datasource.getPluginId()))
                        .flatMap(tuple -> {
                            String instanceId = tuple.getT1();
                            Plugin plugin = tuple.getT2();
                            IntegrationDTO integrationDTO = new IntegrationDTO();
                            integrationDTO.setInstallationKey(instanceId);
                            integrationDTO.setImportForGit(importForGit);
                            integrationDTO.setWorkspaceId(datasource.getWorkspaceId());
                            integrationDTO.setPluginName(plugin.getPluginName());
                            integrationDTO.setPluginVersion(plugin.getVersion());
                            integrationDTO.setContextType(requestAppsmithTokenDTO.getContextType());
                            // TODO add authenticationDTO
                            integrationDTO.setDatasourceId(datasourceId);
                            integrationDTO.setScope(((OAuth2) datasource
                                            .getDatasourceConfiguration()
                                            .getAuthentication())
                                    .getScope());
                            integrationDTO.setRedirectionDomain(redirectUri);
                            return getContext(
                                            requestAppsmithTokenDTO.getContextId(),
                                            requestAppsmithTokenDTO.getContextType())
                                    .map(context -> associateIntegrationDTOWithContext(
                                            integrationDTO, context, requestAppsmithTokenDTO.getContextType()));
                        }))
                .flatMap(integrationDTO -> {
                    Mono<ClientResponse> clientResponseMono = WebClientUtils.create(
                                    cloudServicesConfig.getBaseUrl() + "/api/v1/integrations/oauth/appsmith")
                            .method(HttpMethod.POST)
                            .body(BodyInserters.fromValue(integrationDTO))
                            .exchange();

                    return clientResponseMono
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    return response.bodyToMono(Map.class);
                                } else {
                                    if (response.statusCode().equals(HttpStatus.FORBIDDEN)) {
                                        // Instance is not registered with CS, hence re-registering it
                                        Mono<? extends Config> registerInstanceMono =
                                                instanceConfigHelper.registerInstance();
                                        return registerInstanceMono
                                                .flatMap(config -> clientResponseMono.flatMap(res -> {
                                                    if (res.statusCode().is2xxSuccessful()) {
                                                        // After re-registering the instance, the appsmith token request
                                                        // is successful
                                                        return res.bodyToMono(Map.class);
                                                    } else {
                                                        // After re-registering the instance, the appsmith token request
                                                        // has failed
                                                        log.debug(
                                                                "Unable to retrieve appsmith token with error {}",
                                                                res.statusCode());
                                                        return Mono.error(new AppsmithException(
                                                                AppsmithError.AUTHENTICATION_FAILURE,
                                                                "Unable to retrieve appsmith token with error "
                                                                        + res.statusCode()));
                                                    }
                                                }))
                                                .onErrorResume(e -> {
                                                    log.error("Error while registering instance", e.getMessage());
                                                    return Mono.error(new AppsmithException(
                                                            AppsmithError.AUTHENTICATION_FAILURE,
                                                            "Appsmith Instance Not Registered with Cloud Services "
                                                                    + response.statusCode()));
                                                });
                                    } else {
                                        log.debug(
                                                "Unable to retrieve appsmith token with error {}",
                                                response.statusCode());
                                        return Mono.error(new AppsmithException(
                                                AppsmithError.AUTHENTICATION_FAILURE,
                                                "Unable to retrieve appsmith token with error "
                                                        + response.statusCode()));
                                    }
                                }
                            })
                            .map(body -> String.valueOf(body.get("data")))
                            .zipWith(datasourceStorageMonoCached)
                            .flatMap(tuple -> {
                                String appsmithToken = tuple.getT1();
                                DatasourceStorage datasourceStorage = tuple.getT2();
                                datasourceStorage
                                        .getDatasourceConfiguration()
                                        .getAuthentication()
                                        .setAuthenticationStatus(AuthenticationDTO.AuthenticationStatus.IN_PROGRESS);
                                return datasourceStorageService
                                        .save(datasourceStorage)
                                        .thenReturn(appsmithToken);
                            })
                            .onErrorMap(
                                    ConnectException.class,
                                    error -> new AppsmithException(
                                            AppsmithError.AUTHENTICATION_FAILURE,
                                            "Unable to connect to Appsmith authentication server."));
                })
                .onErrorResume(
                        BaseException.class,
                        error -> datasourceStorageMonoCached.flatMap(datasourceStorage -> {
                            datasourceStorage
                                    .getDatasourceConfiguration()
                                    .getAuthentication()
                                    .setAuthenticationStatus(AuthenticationDTO.AuthenticationStatus.FAILURE);
                            return datasourceStorageService
                                    .save(datasourceStorage)
                                    .then(Mono.error(error));
                        })); // */
    }

    /**
     * Finds the new page from which the appsmith token request has been made
     * @param branchedContextId : id of the branched Context, only applicable for git, else base id is used.
     * @param contextType : context type of the request, in this case it's NewPage
     * @return : An newPage for which the id is provided
     */
    protected Mono<? extends BaseDomain> getContext(String branchedContextId, CreatorContextType contextType) {
        return newPageService
                .findById(branchedContextId, pagePermission.getReadPermission())
                .flatMap(branchedPage -> {
                    // this would be the case for non git connected apps or base branch of a
                    // git connected app
                    if (branchedPage.getId().equals(branchedPage.getBaseIdOrFallback())) {
                        return Mono.just(branchedPage);
                    }

                    return newPageService
                            .findById(branchedPage.getBaseIdOrFallback(), pagePermission.getReadPermission())
                            .map(basePage -> {
                                NewPage pageRedirectionDTO = new NewPage();
                                pageRedirectionDTO.setId(basePage.getId());
                                pageRedirectionDTO.setBaseId(basePage.getBaseId());
                                pageRedirectionDTO.setApplicationId(basePage.getApplicationId());
                                // the ref name should come from the ref page as it is required for redirecting
                                pageRedirectionDTO.setRefName(branchedPage.getRefName());
                                pageRedirectionDTO.setRefType(branchedPage.getRefType());
                                return pageRedirectionDTO;
                            });
                });
    }

    protected IntegrationDTO associateIntegrationDTOWithContext(
            IntegrationDTO integrationDTO, BaseDomain baseDomain, CreatorContextType contextType) {
        NewPage pageRedirectionDTO = (NewPage) baseDomain;
        integrationDTO.setPageId(pageRedirectionDTO.getBaseIdOrFallback());
        integrationDTO.setApplicationId(pageRedirectionDTO.getApplicationId());

        if (hasText(pageRedirectionDTO.getRefName())) {
            integrationDTO.setRefType(pageRedirectionDTO.getRefType());
            integrationDTO.setRefName(pageRedirectionDTO.getRefName());
        }
        return integrationDTO;
    }

    public Mono<OAuth2ResponseDTO> getAccessTokenFromCloud(
            String datasourceId, String environmentId, String appsmithToken) {
        // Check if user has access to manage datasource
        // If yes, check if datasource is in intermediate state
        // If yes, request for token and store in datasource
        // Update datasource as being authorized
        // Return control to client

        Mono<Datasource> datasourceMonoCached = datasourceService
                .findById(datasourceId, datasourcePermission.getEditPermission())
                .cache();

        Mono<String> trueEnvironmentIdCached = datasourceMonoCached
                .flatMap(datasource -> datasourceService.getTrueEnvironmentId(
                        datasource.getWorkspaceId(), environmentId, datasource.getPluginId(), null))
                .cache();

        Mono<DatasourceStorage> datasourceStorageMonoCached = datasourceMonoCached
                .zipWith(trueEnvironmentIdCached)
                .flatMap(tuple2 -> {
                    Datasource datasource = tuple2.getT1();
                    String trueEnvironmentId = tuple2.getT2();
                    return datasourceStorageService.findByDatasourceAndEnvironmentId(datasource, trueEnvironmentId);
                });

        return datasourceStorageMonoCached
                .filter(datasourceStorage -> AuthenticationDTO.AuthenticationStatus.IN_PROGRESS.equals(datasourceStorage
                        .getDatasourceConfiguration()
                        .getAuthentication()
                        .getAuthenticationStatus()))
                .switchIfEmpty(Mono.error(
                        new AppsmithException(AppsmithError.NO_RESOURCE_FOUND, FieldName.DATASOURCE, datasourceId)))
                .flatMap(this::validateRequiredFieldsForGenericOAuth2)
                .flatMap(datasourceStorage -> {
                    UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
                    try {
                        uriBuilder
                                .uri(new URI(cloudServicesConfig.getBaseUrl() + "/api/v1/integrations/oauth/token"))
                                .queryParam("appsmithToken", appsmithToken);
                    } catch (URISyntaxException e) {
                        log.debug("Error while parsing access token URL.", e);
                    }
                    return WebClientUtils.create()
                            .method(HttpMethod.POST)
                            .uri(uriBuilder.build(true).toUri())
                            .exchange()
                            .doOnError(
                                    e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    return response.bodyToMono(AuthenticationResponse.class);
                                } else {
                                    log.debug("Unable to retrieve appsmith token with error {}", response.statusCode());
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.AUTHENTICATION_FAILURE,
                                            "Unable to retrieve appsmith token with error " + response.statusCode()));
                                }
                            })
                            .flatMap(authenticationResponse -> {
                                OAuth2 oAuth2 = (OAuth2) datasourceStorage
                                        .getDatasourceConfiguration()
                                        .getAuthentication();
                                oAuth2.setAuthenticationResponse(authenticationResponse);
                                final Map tokenResponse = (Map) authenticationResponse.getTokenResponse();
                                if (tokenResponse != null && tokenResponse.containsKey("scope")) {
                                    if (!new HashSet<>(Arrays.asList(String.valueOf(tokenResponse.get("scope"))
                                                    .split(" ")))
                                            .containsAll(oAuth2.getScope())) {
                                        return Mono.error(
                                                new AppsmithException(
                                                        AppsmithError.AUTHENTICATION_FAILURE,
                                                        "Please provide access to all the requested scopes to use the integration correctly."));
                                    }
                                }
                                datasourceStorage.getDatasourceConfiguration().setAuthentication(oAuth2);

                                // When authentication scope is for specific sheets, we need to send token and project
                                // id
                                String accessToken = "";
                                String projectID = "";
                                if (oAuth2.getScope() != null
                                        && oAuth2.getScope().contains(FILE_SPECIFIC_DRIVE_SCOPE)) {
                                    accessToken = (String) tokenResponse.get(ACCESS_TOKEN_KEY);
                                    if (authenticationResponse.getProjectID() != null) {
                                        projectID = authenticationResponse.getProjectID();
                                    }
                                }

                                // when authentication scope is other than specific sheets, we need to set
                                // authentication status as success
                                // for specific sheets, it needs to remain in as in progress until files are selected
                                // Once files are selected, client sets authentication status as SUCCESS, we can find
                                // this code in
                                // /app/client/src/sagas/DatasourcesSagas.ts, line 1195
                                Set<String> oauth2Scopes = oAuth2.getScope();
                                if (oauth2Scopes != null) {
                                    if (oauth2Scopes.contains(FILE_SPECIFIC_DRIVE_SCOPE)) {
                                        datasourceStorage
                                                .getDatasourceConfiguration()
                                                .getAuthentication()
                                                .setAuthenticationStatus(
                                                        AuthenticationDTO.AuthenticationStatus
                                                                .IN_PROGRESS_PERMISSIONS_GRANTED);
                                    } else {
                                        datasourceStorage
                                                .getDatasourceConfiguration()
                                                .getAuthentication()
                                                .setAuthenticationStatus(
                                                        AuthenticationDTO.AuthenticationStatus.SUCCESS);
                                    }
                                }

                                Mono<String> accessTokenMono = Mono.just(accessToken);
                                Mono<String> projectIdMono = Mono.just(projectID);

                                return pluginExecutorHelper
                                        .getPluginExecutor(pluginService.findById(datasourceStorage.getPluginId()))
                                        .flatMap(pluginExecutor -> ((PluginExecutor<Object>) pluginExecutor)
                                                .getDatasourceMetadata(datasourceStorage.getDatasourceConfiguration()))
                                        .then(Mono.zip(Mono.just(datasourceStorage), accessTokenMono, projectIdMono));
                            });
                })
                .flatMap(tuple -> {
                    DatasourceStorage datasourceStorage = tuple.getT1();
                    datasourceStorage.setUserPermissions(null);
                    datasourceStorage.setPolicies(null);
                    String accessToken = tuple.getT2();
                    String projectID = tuple.getT3();
                    OAuth2ResponseDTO response = new OAuth2ResponseDTO();
                    response.setToken(accessToken);
                    response.setProjectID(projectID);
                    response.setDatasource(datasourceStorage);
                    return datasourceStorageService.save(datasourceStorage).thenReturn(response);
                })
                .onErrorMap(
                        ConnectException.class,
                        error -> new AppsmithException(
                                AppsmithError.AUTHENTICATION_FAILURE,
                                "Unable to connect to Appsmith authentication server."))
                .onErrorResume(
                        BaseException.class,
                        error -> datasourceStorageMonoCached.flatMap(datasourceStorage -> {
                            datasourceStorage
                                    .getDatasourceConfiguration()
                                    .getAuthentication()
                                    .setAuthenticationStatus(AuthenticationDTO.AuthenticationStatus.FAILURE);
                            return datasourceStorageService
                                    .save(datasourceStorage)
                                    .then(Mono.error(error));
                        })); // */
    }

    public Mono<DatasourceStorage> refreshAuthentication(DatasourceStorage datasourceStorage) {
        // This method will always be called from a point where these validations have been performed
        assert (datasourceStorage != null
                && datasourceStorage.getDatasourceConfiguration() != null
                && datasourceStorage.getDatasourceConfiguration().getAuthentication() instanceof OAuth2);
        OAuth2 oAuth2 = (OAuth2) datasourceStorage.getDatasourceConfiguration().getAuthentication();
        return pluginService
                .findById(datasourceStorage.getPluginId())
                .filter(plugin ->
                        PluginType.SAAS.equals(plugin.getType()) || PluginType.REMOTE.equals(plugin.getType()))
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

                    return WebClientUtils.create(
                                    cloudServicesConfig.getBaseUrl() + "/api/v1/integrations/oauth/refresh")
                            .method(HttpMethod.POST)
                            .body(BodyInserters.fromValue(integrationDTO))
                            .exchange()
                            .onErrorMap(e -> new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e))
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    return response.bodyToMono(AuthenticationResponse.class);
                                } else {
                                    log.debug("Unable to retrieve appsmith token with error {}", response.statusCode());
                                    return Mono.error(new AppsmithException(
                                            AppsmithError.AUTHENTICATION_FAILURE, response.statusCode()));
                                }
                            })
                            .flatMap(authenticationResponse -> {
                                // We need to set refresh token here, because refresh token API call made to google,
                                // does not return refresh token in the response
                                // hence it was resulting in refresh token being set as null, that would break the
                                // authentication.
                                authenticationResponse.setRefreshToken(integrationDTO
                                        .getAuthenticationResponse()
                                        .getRefreshToken());
                                oAuth2.setAuthenticationResponse(authenticationResponse);
                                datasourceStorage.getDatasourceConfiguration().setAuthentication(oAuth2);

                                // We need to return datasourceStorage object from the database so as to get decrypted
                                // token values,
                                // if we dont then, encrypted token values would be returned and subsequently those
                                // encrypted values would be used to call google apis
                                return datasourceStorageService
                                        .save(datasourceStorage)
                                        .flatMap(ignore -> datasourceService
                                                .findByIdWithStorages(datasourceStorage.getDatasourceId())
                                                .flatMap(datasource ->
                                                        datasourceStorageService.findByDatasourceAndEnvironmentId(
                                                                datasource, datasourceStorage.getEnvironmentId())));
                            });
                })
                .switchIfEmpty(Mono.just(datasourceStorage))
                .onErrorMap(
                        ConnectException.class,
                        error -> new AppsmithException(
                                AppsmithError.AUTHENTICATION_FAILURE,
                                "Unable to connect to Appsmith authentication server."));
    }
}
