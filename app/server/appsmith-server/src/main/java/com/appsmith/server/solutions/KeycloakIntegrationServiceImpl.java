package com.appsmith.server.solutions;

import com.appsmith.server.configurations.KeycloakConfig;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeType;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.text.StringEscapeUtils;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import static java.lang.Boolean.TRUE;
import static org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED;

@Service
@Slf4j
public class KeycloakIntegrationServiceImpl implements KeycloakIntegrationService {

    private static final String AUTHORIZATION = "Authorization";
    private static final String REALM_URI = "/auth/admin/realms/";
    private static String REALM_NAME = "appsmith";
    private static final String CLIENT_URI = REALM_URI + REALM_NAME + "/clients";
    private static String CLIENT = "appsmith-broker";
    private static String ACCESS_TOKEN_URI = "/auth/realms/master/protocol/openid-connect/token";
    private static String IDENTITY_PROVIDER_URI = REALM_URI + REALM_NAME + "/identity-provider";
    private static String IDP_NAME = "saml";

    private final KeycloakConfig config;
    private final ObjectMapper objectMapper;
    private final DataBufferFactory dataBufferFactory;

    public KeycloakIntegrationServiceImpl(KeycloakConfig config) {
        this.config = config;
        this.objectMapper = new ObjectMapper();
        this.dataBufferFactory = new DefaultDataBufferFactory();
    }

    @Override
    public Mono<Boolean> createRealm() {
        Map<String, Object> realmRepresentation = new HashMap();
        realmRepresentation.put("realm", REALM_NAME);
        realmRepresentation.put("enabled", true);

        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(MediaType.APPLICATION_JSON));

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(REALM_URI));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();

        return getAccessTokenForAdministrativeTask()
                .flatMap(accessToken -> {
                    webClientBuilder.defaultHeader(AUTHORIZATION, "Bearer " + accessToken);
                    WebClient webClient = webClientBuilder.build();

                    return webClient
                            .method(HttpMethod.POST)
                            .uri(uri)
                            .body(BodyInserters.fromValue(realmRepresentation))
                            .exchange()
                            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                            .flatMap(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                HttpStatus statusCode = stringResponseEntity.getStatusCode();
                                if (!statusCode.is2xxSuccessful()) {
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                }

                                return Mono.just(TRUE);
                            });
                });

    }


    @Override
    public Mono<Boolean> createClient(String baseUrl) {
        Map<String, Object> clientRepresentation = new HashMap();
        clientRepresentation.put("clientId", CLIENT);
        clientRepresentation.put("name", "${client_broker}");
        clientRepresentation.put("surrogateAuthRequired", false);
        clientRepresentation.put("enabled", true);
        clientRepresentation.put("clientAuthenticatorType", "client-secret");
        clientRepresentation.put("redirectUris", List.of(baseUrl + "/*"));
        clientRepresentation.put("bearerOnly", false);
        clientRepresentation.put("standardFlowEnabled", true);
        clientRepresentation.put("directAccessGrantsEnabled", true);
        clientRepresentation.put("publicClient", true);
        clientRepresentation.put("protocol", "openid-connect");
        clientRepresentation.put("attributes", new HashMap<>());
        clientRepresentation.put("authenticationFlowBindingOverrides", new HashMap<>());
        clientRepresentation.put("fullScopeAllowed", true);
        clientRepresentation.put("defaultClientScopes", List.of("web-origins",
                "roles",
                "profile",
                "email"));
        clientRepresentation.put("optionalClientScopes", List.of("address",
                "phone",
                "offline_access",
                "microprofile-jwt"));
        clientRepresentation.put("access", Map.of("view", true,
                "configure", true,
                "manage", true));
        clientRepresentation.put("authorizationServicesEnabled", "");

        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(MediaType.APPLICATION_JSON));

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(CLIENT_URI));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();

        return getAccessTokenForAdministrativeTask()
                .flatMap(accessToken -> {
                    webClientBuilder.defaultHeader(AUTHORIZATION, "Bearer " + accessToken);
                    WebClient webClient = webClientBuilder.build();

                    return webClient
                            .method(HttpMethod.POST)
                            .uri(uri)
                            .body(BodyInserters.fromValue(clientRepresentation))
                            .exchange()
                            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                            .flatMap(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                HttpStatus statusCode = stringResponseEntity.getStatusCode();
                                if (!statusCode.is2xxSuccessful()) {
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                }

                                return Mono.just(TRUE);
                            });
                });
    }

    public Mono<String> generateClientSecret() {

        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(MediaType.APPLICATION_JSON));

        return Mono.zip(getAccessTokenForAdministrativeTask(), getInternalClientId(CLIENT))
                .flatMap(tuple -> {
                    String accessToken = tuple.getT1();
                    String internalClientId = tuple.getT2();

                    UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
                    try {
                        uriBuilder.uri(new URI(CLIENT_URI + "/" + internalClientId + "/client-secret"));
                    } catch (URISyntaxException e) {
                        return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                    }

                    URI uri = uriBuilder.build(true).toUri();

                    webClientBuilder.defaultHeader(AUTHORIZATION, "Bearer " + accessToken);
                    WebClient webClient = webClientBuilder.build();

                    Map<String, String> credentialRequestBody = new HashMap<>();
                    credentialRequestBody.put("realm", REALM_NAME);
                    credentialRequestBody.put("client", internalClientId);

                    return webClient
                            .method(HttpMethod.POST)
                            .uri(uri)
                            .body(BodyInserters.fromValue(credentialRequestBody))
                            .exchange()
                            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                            .flatMap(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                byte[] body = stringResponseEntity.getBody();

                                if (body != null && MediaType.APPLICATION_JSON.equals(contentType)) {
                                    String jsonBody = new String(body);
                                    try {
                                        JsonNode jsonNode = objectMapper.readTree(jsonBody);
                                        return Mono.just(jsonNode.get("value").asText());
                                    } catch (IOException e) {
                                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, jsonBody, e));
                                    }
                                }

                                return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                            });
                });
    }

    private Mono<String> getInternalClientId(String clientId) {

        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(MediaType.APPLICATION_JSON));

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(CLIENT_URI + "?clientId=" + clientId));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();

        return getAccessTokenForAdministrativeTask()
                .flatMap(accessToken -> {
                    webClientBuilder.defaultHeader(AUTHORIZATION, "Bearer " + accessToken);
                    WebClient webClient = webClientBuilder.build();

                    return webClient
                            .method(HttpMethod.GET)
                            .uri(uri)
                            .exchange()
                            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                            .flatMap(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                byte[] body = stringResponseEntity.getBody();

                                if (body != null && MediaType.APPLICATION_JSON.equals(contentType)) {
                                    String jsonBody = new String(body);
                                    try {
                                        JsonNode jsonNode = objectMapper.readTree(jsonBody);
                                        if (jsonNode != null && JsonNodeType.ARRAY.equals(jsonNode.getNodeType())) {
                                            Iterator<JsonNode> iter = jsonNode.elements();
                                            while (iter.hasNext()) {
                                                JsonNode element = iter.next();
                                                String clientName = element.get("clientId").asText();
                                                if (clientId.equals(clientName)) {
                                                    return Mono.just(element.get("id").asText());
                                                }
                                            }
                                        }
                                    } catch (IOException e) {
                                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, jsonBody, e));
                                    }
                                }

                                return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                            });
                });
    }

    @Override
    public Mono<Map<String, Object>> importSamlConfigFromUrl(Map<String, String> request, String baseUrl) {
        Map<String, Object> idPImportRequest = new HashMap();
        idPImportRequest.put("fromUrl", request.get("url"));
        idPImportRequest.put("providerId", "saml");

        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(MediaType.APPLICATION_JSON));

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(IDENTITY_PROVIDER_URI + "/import-config"));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();

        return getAccessTokenForAdministrativeTask()
                .flatMap(accessToken -> {
                    webClientBuilder.defaultHeader(AUTHORIZATION, "Bearer " + accessToken);
                    WebClient webClient = webClientBuilder.build();

                    return webClient
                            .method(HttpMethod.POST)
                            .uri(uri)
                            .body(BodyInserters.fromValue(idPImportRequest))
                            .exchange()
                            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                            .flatMap(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                HttpStatus statusCode = stringResponseEntity.getStatusCode();
                                if (!statusCode.is2xxSuccessful()) {
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                }

                                byte[] body = stringResponseEntity.getBody();

                                if (body != null && MediaType.APPLICATION_JSON.equals(contentType)) {
                                    String jsonBody = new String(body);
                                    try {
                                        TypeReference<Map<String, Object>> tr = new TypeReference<>() {
                                        };
                                        Map<String, Object> responseMap = objectMapper.readValue(jsonBody, tr);
                                        return Mono.just(responseMap);
                                    } catch (IOException e) {
                                        return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, jsonBody, e));
                                    }
                                }

                                return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                            });
                });
    }

    @Override
    public Mono<Boolean> createSamlIdentityProviderOnKeycloak(Map<String, Object> identityProviderRequest) {

        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(MediaType.APPLICATION_JSON));

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(IDENTITY_PROVIDER_URI + "/instances"));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();

        return getAccessTokenForAdministrativeTask()
                .flatMap(accessToken -> {
                    webClientBuilder.defaultHeader(AUTHORIZATION, "Bearer " + accessToken);
                    WebClient webClient = webClientBuilder.build();

                    return webClient
                            .method(HttpMethod.POST)
                            .uri(uri)
                            .body(BodyInserters.fromValue(identityProviderRequest))
                            .exchange()
                            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                            .flatMap(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                HttpStatus statusCode = stringResponseEntity.getStatusCode();
                                if (!statusCode.is2xxSuccessful()) {
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                }

                                return Mono.just(TRUE);
                            });
                });
    }

    @Override
    public Mono<Boolean> createSamlIdentityProviderExplicitConfiguration(Map<String, Object> configuration, String baseUrl) {

        if (configuration == null || configuration.isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "SAML configuration"));
        }

        Object singleSignOnServiceUrlObj = configuration.get("singleSignOnServiceUrl");
        if (singleSignOnServiceUrlObj == null || ((String) singleSignOnServiceUrlObj).isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Single Sign On URL"));
        }
        String singleSignOnServiceUrl = (String) singleSignOnServiceUrlObj;

        Object signingCertificate = configuration.get("signingCertificate");
        if (signingCertificate == null || ((String) signingCertificate).isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "X509 Certificate"));
        }

        Object emailField = configuration.get("emailField");
        if (emailField == null || ((String) emailField).isEmpty()) {
            return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, "Email Format"));
        }

        configuration.put("singleSignOnServiceUrl", singleSignOnServiceUrl);
        // Now add default values which do not require user intervention
        configuration.put("postBindingResponse", true);
        configuration.put("postBindingAuthnRequest", true);
        configuration.put("validateSignature", false);
        configuration.put("syncMode", "IMPORT");
        configuration.put("nameIDPolicyFormat", emailField);

        return createSamlIdentityProviderOnKeycloak(generateSamlIdpFromConfig(configuration, baseUrl));

    }

    private Map<String, Object> generateSamlIdpFromConfig(Map<String, Object> configuration, String baseUrl) {

        // Add default configurations which must be applied irrespective of the mode of configuring the IDP.
        configuration.put("entityId", baseUrl + "/auth/realms/appsmith");
        configuration.put("syncMode", "IMPORT");

        Map<String, Object> identityProviderRequest = new HashMap();
        identityProviderRequest.put("alias", IDP_NAME);
        identityProviderRequest.put("displayName", IDP_NAME);
        identityProviderRequest.put("enabled", true);
        identityProviderRequest.put("providerId", IDP_NAME);
        identityProviderRequest.put("config", configuration);

        return identityProviderRequest;
    }


    @Override
    public Mono<Boolean> createSamlIdentityProviderFromIdpConfigFromUrl(Map<String, String> request, String baseUrl) {

        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(MediaType.APPLICATION_JSON));

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(IDENTITY_PROVIDER_URI + "/instances"));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();


        return importSamlConfigFromUrl(request, baseUrl)
                .flatMap(parsedConfigMap -> createSamlIdentityProviderOnKeycloak(generateSamlIdpFromConfig(parsedConfigMap, baseUrl)));

    }

    private Mono<String> getAccessTokenForAdministrativeTask() {
        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(APPLICATION_FORM_URLENCODED));
        WebClient webClient = webClientBuilder.build();

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(ACCESS_TOKEN_URI));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();

        return webClient
                .method(HttpMethod.POST)
                .uri(uri)
                .body(
                        BodyInserters.fromFormData("grant_type", "password")
                                .with("client_id", "admin-cli")
                                .with("username", config.getUsername())
                                .with("password", config.getPassword()))
                .exchange()
                .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                .flatMap(stringResponseEntity -> {
                    HttpHeaders headers = stringResponseEntity.getHeaders();
                    // Find the media type of the response to parse the body as required.
                    MediaType contentType = headers.getContentType();
                    byte[] body = stringResponseEntity.getBody();

                    if (body != null && MediaType.APPLICATION_JSON.equals(contentType)) {
                        String jsonBody = new String(body);
                        try {
                            JsonNode jsonNode = objectMapper.readTree(jsonBody);
                            return Mono.just(jsonNode.get("access_token").asText());
                        } catch (IOException e) {
                            return Mono.error(new AppsmithException(AppsmithError.JSON_PROCESSING_ERROR, jsonBody, e));
                        }

                    }

                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                });
    }

    @Override
    public Mono<Boolean> deleteRealm() {

        WebClient.Builder webClientBuilder = WebClient.builder();
        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();

        try {
            uriBuilder.uri(new URI(REALM_URI + REALM_NAME));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();

        return getAccessTokenForAdministrativeTask()
                .flatMap(accessToken -> {
                    webClientBuilder.defaultHeader(AUTHORIZATION, "Bearer " + accessToken);
                    WebClient webClient = webClientBuilder.build();

                    return webClient
                            .method(HttpMethod.DELETE)
                            .uri(uri)
                            .exchange()
                            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                            .flatMap(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                HttpStatus statusCode = stringResponseEntity.getStatusCode();
                                if (!statusCode.is2xxSuccessful()) {
                                    return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
                                }

                                return Mono.just(TRUE);
                            });
                });
    }

    @Override
    public Mono<Boolean> createSamlIdentityProviderFromXml(String importFromXml, String baseUrl) {

        String decodedXML = StringEscapeUtils.unescapeHtml4(importFromXml);
        byte[] xmlBytes = decodedXML.getBytes(StandardCharsets.UTF_8);
        DataBuffer dataBuffer = dataBufferFactory.wrap(xmlBytes);

        return importSamlConfigFromData(dataBuffer)
                .flatMap(parsedConfigMap -> createSamlIdentityProviderOnKeycloak(generateSamlIdpFromConfig(parsedConfigMap, baseUrl)));

    }

    private Mono<Map<String, Object>> importSamlConfigFromData(DataBuffer request) {

        WebClient.Builder webClientBuilder = WebClient.builder();
        webClientBuilder.defaultHeader(HttpHeaders.CONTENT_TYPE, String.valueOf(MediaType.MULTIPART_FORM_DATA));

        UriComponentsBuilder uriBuilder = UriComponentsBuilder.newInstance();
        try {
            uriBuilder.uri(new URI(IDENTITY_PROVIDER_URI + "/import-config"));
        } catch (URISyntaxException e) {
            return Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR));
        }

        URI uri = uriBuilder.build(true).toUri();

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", request);
        builder.part("providerId", "saml");

        return getAccessTokenForAdministrativeTask()
                .flatMap(accessToken -> {
                    webClientBuilder.defaultHeader(AUTHORIZATION, "Bearer " + accessToken);
                    WebClient webClient = webClientBuilder.build();

                    return webClient
                            .method(HttpMethod.POST)
                            .uri(uri)
                            .body(BodyInserters.fromMultipartData(builder.build()))
                            .exchange()
                            .flatMap(clientResponse -> clientResponse.toEntity(byte[].class))
                            .flatMap(stringResponseEntity -> {
                                HttpHeaders headers = stringResponseEntity.getHeaders();
                                // Find the media type of the response to parse the body as required.
                                MediaType contentType = headers.getContentType();
                                HttpStatus statusCode = stringResponseEntity.getStatusCode();

                                if (!statusCode.is2xxSuccessful()) {
                                    return Mono.error(new AppsmithException(AppsmithError.SAML_CONFIGURATION_FAILURE));
                                }

                                byte[] body = stringResponseEntity.getBody();

                                if (body != null && MediaType.APPLICATION_JSON.equals(contentType)) {
                                    String jsonBody = new String(body);
                                    try {
                                        TypeReference<Map<String, Object>> tr = new TypeReference<>() {
                                        };
                                        Map<String, Object> responseMap = objectMapper.readValue(jsonBody, tr);
                                        return Mono.just(responseMap);
                                    } catch (IOException e) {
                                        return Mono.error(new AppsmithException(AppsmithError.SAML_CONFIGURATION_FAILURE, jsonBody, e));
                                    }
                                }

                                return Mono.error(new AppsmithException(AppsmithError.SAML_CONFIGURATION_FAILURE));
                            });
                });
    }
}
