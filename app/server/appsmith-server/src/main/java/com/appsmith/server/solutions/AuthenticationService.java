package com.appsmith.server.solutions;

import com.appsmith.external.models.OAuth2;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginError;
import com.appsmith.external.exceptions.pluginExceptions.AppsmithPluginException;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.DatasourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.internal.Base64;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Instant;
import java.util.Map;

import static com.appsmith.external.constants.Authentication.ACCESS_TOKEN;
import static com.appsmith.external.constants.Authentication.AUTHORIZATION_CODE;
import static com.appsmith.external.constants.Authentication.AUTHORIZATION_URL;
import static com.appsmith.external.constants.Authentication.CLIENT_ID;
import static com.appsmith.external.constants.Authentication.CLIENT_SECRET;
import static com.appsmith.external.constants.Authentication.CODE;
import static com.appsmith.external.constants.Authentication.EXPIRES_IN;
import static com.appsmith.external.constants.Authentication.GRANT_TYPE;
import static com.appsmith.external.constants.Authentication.REDIRECT_URI;
import static com.appsmith.external.constants.Authentication.REFRESH_TOKEN;
import static com.appsmith.external.constants.Authentication.SCOPE;
import static com.appsmith.external.constants.Authentication.STATE;
import static org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames.RESPONSE_TYPE;


@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final DatasourceService datasourceService;

    public Mono<String> getAuthorizationCodeURL(String datasourceId) {
        return datasourceService.getById(datasourceId)
                .flatMap(this::validateRequiredFields)
                .flatMap((datasource -> {
                    OAuth2 oAuth2 = (OAuth2) datasource.getDatasourceConfiguration().getAuthentication();
                    // Add basic uri components
                    UriComponentsBuilder uriComponentsBuilder = UriComponentsBuilder
                            .fromUriString(oAuth2.getAuthorizationUrl())
                            .queryParam(CLIENT_ID, oAuth2.getClientId())
                            .queryParam(RESPONSE_TYPE, "code")
                            .queryParam(REDIRECT_URI, "https://app.appsmith.com/applications")
                            .queryParam(STATE, datasourceId);
                    // Adding optional scope parameter
                    if (!oAuth2.getScope().isEmpty()) {
                        uriComponentsBuilder
                                .queryParam(SCOPE, String.join(",", oAuth2.getScope()));
                    }
                    // Adding additional user-defined parameters
                    if (oAuth2.getCustomAuthenticationParameters() != null) {
                        oAuth2.getCustomAuthenticationParameters().forEach(x ->
                                uriComponentsBuilder.queryParam(x.getKey(), x.getValue())
                        );
                    }

                    return Mono.just(uriComponentsBuilder.toUriString());
                }));
    }

    private Mono<Datasource> validateRequiredFields(Datasource datasource) {
        if (!(datasource.getDatasourceConfiguration().getAuthentication() instanceof OAuth2)) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "authentication"));
        }
        OAuth2 oAuth2 = (OAuth2) datasource.getDatasourceConfiguration().getAuthentication();
        if (oAuth2.getClientId() == null || oAuth2.getClientId().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, CLIENT_ID));
        }
        if (oAuth2.getClientSecret() == null || oAuth2.getClientSecret().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, CLIENT_SECRET));
        }
        if (oAuth2.getAuthorizationUrl() == null || oAuth2.getAuthorizationUrl().isBlank()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, AUTHORIZATION_URL));
        }

        return Mono.just(datasource);
    }

    public Mono<Datasource> getAccessToken(String code, String state, String scope) {
        return datasourceService.getById(state)
                .flatMap(datasource -> {
                    OAuth2 oAuth2 = (OAuth2) datasource.getDatasourceConfiguration().getAuthentication();
                    WebClient.Builder builder = WebClient.builder();

                    WebClient webClient = builder
                            .baseUrl(oAuth2.getAccessTokenUrl())
                            .clientConnector(new ReactorClientHttpConnector(
                                    HttpClient.create().wiretap(true)
                            ))
                            .build();

                    MultiValueMap<String, String> map = new LinkedMultiValueMap<>();

                    // Add required fields
                    map.add(GRANT_TYPE, AUTHORIZATION_CODE);
                    map.add(CODE, code);
                    map.add(REDIRECT_URI, "https://app.appsmith.com/applications");
                    if (!oAuth2.getScope().isEmpty()) {
                        map.add(SCOPE, String.join(",", oAuth2.getScope()));
                    }

                    // Add client credentials to header or body, as configured
                    if (Boolean.FALSE.equals(oAuth2.getIsAuthorizationHeader())) {
                        map.add(CLIENT_ID, oAuth2.getClientId());
                        map.add(CLIENT_SECRET, oAuth2.getClientSecret());
                    } else if (Boolean.TRUE.equals(oAuth2.getIsAuthorizationHeader())) {
                        byte[] clientCredentials = (oAuth2.getClientId() + ":" + oAuth2.getClientSecret()).getBytes();
                        webClient.head().header("Authorization", "Basic " + Base64.encode(clientCredentials));
                    } else {
                        return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "isAuthorizationHeader"));
                    }

                    return webClient
                            .method(HttpMethod.POST)
                            .body(BodyInserters.fromFormData(map))
                            .exchange()
                            .doOnError(e -> Mono.error(new AppsmithPluginException(AppsmithPluginError.PLUGIN_ERROR, e)))
                            .flatMap(response -> {
                                if (response.statusCode().is2xxSuccessful()) {
                                    return response.bodyToMono(Map.class);
                                } else {
                                    return Mono.error(new AppsmithException(AppsmithError.INVALID_DATASOURCE_CONFIGURATION));
                                }
                            })
                            .flatMap(response -> {
                                oAuth2.setTokenResponse(response);
                                oAuth2.setToken((String) response.get(ACCESS_TOKEN));
                                oAuth2.setRefreshToken((String) response.get(REFRESH_TOKEN));
                                oAuth2.setExpiresAt(Instant.now().plusSeconds(Long.valueOf((Integer) response.get(EXPIRES_IN))));

                                datasource.getDatasourceConfiguration().setAuthentication(oAuth2);
                                return datasourceService.update(datasource.getId(), datasource);
                            });
                });
    }
}
