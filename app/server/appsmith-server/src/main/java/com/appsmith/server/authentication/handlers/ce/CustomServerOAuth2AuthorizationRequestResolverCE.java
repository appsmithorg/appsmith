package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.constants.Security;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.RedirectHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.crypto.keygen.Base64StringKeyGenerator;
import org.springframework.security.crypto.keygen.StringKeyGenerator;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.oauth2.core.endpoint.OAuth2ParameterNames;
import org.springframework.security.oauth2.core.endpoint.PkceParameterNames;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.security.oauth2.core.oidc.endpoint.OidcParameterNames;
import org.springframework.security.web.server.util.matcher.PathPatternParserServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.util.Assert;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * This class is a copy of {@link org.springframework.security.oauth2.client.web.server.DefaultServerOAuth2AuthorizationRequestResolver}
 * It has been copied so as to override the creation of the `state` query parameter sent to the OAuth2 authentication server
 * The only 2 functions that have been overridden from the base class are: {@link #generateKey(ServerHttpRequest)} and
 * {@link #authorizationRequest(ServerWebExchange, ClientRegistration)}.
 * We couldn't simply extend the base class because of the use of private variables and methods to invoke these functions.
 */
@Slf4j
public class CustomServerOAuth2AuthorizationRequestResolverCE implements ServerOAuth2AuthorizationRequestResolver {

    /**
     * The name of the path variable that contains the {@link ClientRegistration#getRegistrationId()}
     */
    public static final String DEFAULT_REGISTRATION_ID_URI_VARIABLE_NAME = "registrationId";

    /**
     * The default pattern used to resolve the {@link ClientRegistration#getRegistrationId()}
     */
    public static final String DEFAULT_AUTHORIZATION_REQUEST_PATTERN = "/oauth2/authorization/{" + DEFAULT_REGISTRATION_ID_URI_VARIABLE_NAME + "}";

    private static final char PATH_DELIMITER = '/';

    private final ServerWebExchangeMatcher authorizationRequestMatcher;

    private final ReactiveClientRegistrationRepository clientRegistrationRepository;

    private final StringKeyGenerator stateGenerator = new Base64StringKeyGenerator(Base64.getUrlEncoder());

    private final StringKeyGenerator secureKeyGenerator = new Base64StringKeyGenerator(Base64.getUrlEncoder().withoutPadding(), 96);

    private static final String MISSING_VALUE_SENTINEL = "missing_value_sentinel";

    private final CommonConfig commonConfig;

    private final RedirectHelper redirectHelper;

    /**
     * Creates a new instance
     *  @param clientRegistrationRepository the repository to resolve the {@link ClientRegistration}
     * @param commonConfig
     * @param redirectHelper
     */
    public CustomServerOAuth2AuthorizationRequestResolverCE(ReactiveClientRegistrationRepository clientRegistrationRepository,
                                                            CommonConfig commonConfig,
                                                            RedirectHelper redirectHelper) {
        this(clientRegistrationRepository, new PathPatternParserServerWebExchangeMatcher(
                DEFAULT_AUTHORIZATION_REQUEST_PATTERN), commonConfig, redirectHelper);
    }

    /**
     * Creates a new instance
     *  @param clientRegistrationRepository the repository to resolve the {@link ClientRegistration}
     * @param authorizationRequestMatcher  the matcher that determines if the request is a match and extracts the
     *                                     {@link #DEFAULT_REGISTRATION_ID_URI_VARIABLE_NAME} from the path variables.
     * @param redirectHelper
     */
    public CustomServerOAuth2AuthorizationRequestResolverCE(ReactiveClientRegistrationRepository clientRegistrationRepository,
                                                            ServerWebExchangeMatcher authorizationRequestMatcher,
                                                            CommonConfig commonConfig,
                                                            RedirectHelper redirectHelper) {
        this.redirectHelper = redirectHelper;
        Assert.notNull(clientRegistrationRepository, "clientRegistrationRepository cannot be null");
        Assert.notNull(authorizationRequestMatcher, "authorizationRequestMatcher cannot be null");
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.authorizationRequestMatcher = authorizationRequestMatcher;
        this.commonConfig = commonConfig;
    }

    @Override
    public Mono<OAuth2AuthorizationRequest> resolve(ServerWebExchange exchange) {
        return this.authorizationRequestMatcher.matches(exchange)
                .filter(ServerWebExchangeMatcher.MatchResult::isMatch)
                .map(ServerWebExchangeMatcher.MatchResult::getVariables)
                .map(variables -> variables.get(DEFAULT_REGISTRATION_ID_URI_VARIABLE_NAME))
                .cast(String.class)
                .flatMap(clientRegistrationId -> resolve(exchange, clientRegistrationId));
    }

    @Override
    public Mono<OAuth2AuthorizationRequest> resolve(ServerWebExchange exchange,
                                                    String clientRegistrationId) {
        return this.findByRegistrationId(clientRegistrationId)
                .flatMap(clientRegistration -> {
                    if (MISSING_VALUE_SENTINEL.equals(clientRegistration.getClientId())) {
                        return Mono.error(new AppsmithException(AppsmithError.OAUTH_NOT_AVAILABLE, clientRegistrationId));
                    } else {
                        return authorizationRequest(exchange, clientRegistration);
                    }
                });
    }

    private Mono<ClientRegistration> findByRegistrationId(String clientRegistration) {
        return this.clientRegistrationRepository.findByRegistrationId(clientRegistration)
                .switchIfEmpty(Mono.error(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid client registration id")));
    }

    private Mono<OAuth2AuthorizationRequest> authorizationRequest(ServerWebExchange exchange,
                                                            ClientRegistration clientRegistration) {
        String redirectUriStr = expandRedirectUri(exchange.getRequest(), clientRegistration);

        Map<String, Object> attributes = new HashMap<>();
        attributes.put(OAuth2ParameterNames.REGISTRATION_ID, clientRegistration.getRegistrationId());

        OAuth2AuthorizationRequest.Builder builder;
        if (AuthorizationGrantType.AUTHORIZATION_CODE.equals(clientRegistration.getAuthorizationGrantType())) {
            builder = OAuth2AuthorizationRequest.authorizationCode();
            Map<String, Object> additionalParameters = new HashMap<>();
            if (!CollectionUtils.isEmpty(clientRegistration.getScopes()) &&
                    clientRegistration.getScopes().contains(OidcScopes.OPENID)) {
                // Section 3.1.2.1 Authentication Request - https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest
                // scope
                // 		REQUIRED. OpenID Connect requests MUST contain the "openid" scope value.
                addNonceParameters(attributes, additionalParameters);
            }
            if (ClientAuthenticationMethod.NONE.equals(clientRegistration.getClientAuthenticationMethod())) {
                addPkceParameters(attributes, additionalParameters);
            }
            if (!commonConfig.getOauthAllowedDomains().isEmpty()) {
                if (commonConfig.getOauthAllowedDomains().size() == 1) {
                    // Incase there's only 1 domain, we can do a further optimization to let the user select a specific one
                    // from the list
                    additionalParameters.put("hd", commonConfig.getOauthAllowedDomains().get(0));
                } else {
                    // Add multiple domains to the list of allowed domains
                    additionalParameters.put("hd", commonConfig.getOauthAllowedDomains());
                }
            }

            builder.additionalParameters(additionalParameters);
        } else if (AuthorizationGrantType.IMPLICIT.equals(clientRegistration.getAuthorizationGrantType())) {
            builder = OAuth2AuthorizationRequest.implicit();
        } else {
            throw new IllegalArgumentException(
                    "Invalid Authorization Grant Type (" + clientRegistration.getAuthorizationGrantType().getValue()
                            + ") for Client Registration with Id: " + clientRegistration.getRegistrationId());
        }

        return generateKey(exchange.getRequest())
                .map(key -> builder
                        .clientId(clientRegistration.getClientId())
                        .authorizationUri(clientRegistration.getProviderDetails().getAuthorizationUri())
                        .redirectUri(redirectUriStr).scopes(clientRegistration.getScopes())
                        .state(key)
                        .attributes(attributes)
                        .build());
    }

    /**
     * This function sets the state query parameter sent to the OAuth2 resource server along with the parameter of the
     * referer which initiated this OAuth2 login. On successful login, we will redirect back to the client's index page
     * based on the referer so as to transfer control back to it. If the referer is not available, we default to
     * redirecting to the server's index page.
     *
     * @param request ServerHttpRequest object for which a key will be generated.
     * @return Publishes a single String, that is the generated key.
     */
    private Mono<String> generateKey(ServerHttpRequest request) {
        return redirectHelper.getRedirectUrl(request)
                .map(redirectUrl -> {
                    String stateKey = this.stateGenerator.generateKey();
                    stateKey = stateKey + "," + Security.STATE_PARAMETER_ORIGIN + redirectUrl;
                    return stateKey;
                });
    }

    /**
     * Expands the {@link ClientRegistration#getRedirectUriTemplate()} with following provided variables:<br/>
     * - baseUrl (e.g. https://localhost/app) <br/>
     * - baseScheme (e.g. https) <br/>
     * - baseHost (e.g. localhost) <br/>
     * - basePort (e.g. :8080) <br/>
     * - basePath (e.g. /app) <br/>
     * - registrationId (e.g. google) <br/>
     * - action (e.g. login) <br/>
     * <p/>
     * Null variables are provided as empty strings.
     * <p/>
     * Default redirectUriTemplate is: {@link org.springframework.security.config.oauth2.client}.CommonOAuth2Provider#DEFAULT_REDIRECT_URL
     *
     * @return expanded URI
     */
    private static String expandRedirectUri(ServerHttpRequest request, ClientRegistration clientRegistration) {
        Map<String, String> uriVariables = new HashMap<>();
        uriVariables.put(DEFAULT_REGISTRATION_ID_URI_VARIABLE_NAME, clientRegistration.getRegistrationId());

        UriComponents uriComponents = UriComponentsBuilder.fromUri(request.getURI())
                .replacePath(request.getPath().contextPath().value())
                .replaceQuery(null)
                .fragment(null)
                .build();
        String scheme = uriComponents.getScheme();
        uriVariables.put("baseScheme", scheme == null ? "" : scheme);
        String host = uriComponents.getHost();
        uriVariables.put("baseHost", host == null ? "" : host);
        // following logic is based on HierarchicalUriComponents#toUriString()
        int port = uriComponents.getPort();
        uriVariables.put("basePort", port == -1 ? "" : ":" + port);
        String path = uriComponents.getPath();
        if (StringUtils.hasLength(path) && path.charAt(0) != PATH_DELIMITER) {
                path = PATH_DELIMITER + path;
        }
        uriVariables.put("basePath", path == null ? "" : path);
        uriVariables.put("baseUrl", uriComponents.toUriString());

        String action = "";
        if (AuthorizationGrantType.AUTHORIZATION_CODE.equals(clientRegistration.getAuthorizationGrantType())) {
            action = "login";
        }
        uriVariables.put("action", action);

        return UriComponentsBuilder.fromUriString(clientRegistration.getRedirectUriTemplate())
                .buildAndExpand(uriVariables)
                .toUriString();
    }

    /**
     * Creates nonce and its hash for use in OpenID Connect 1.0 Authentication Requests.
     *
     * @param attributes           where the {@link OidcParameterNames#NONCE} is stored for the authentication request
     * @param additionalParameters where the {@link OidcParameterNames#NONCE} hash is added for the authentication request
     * @see <a target="_blank" href="https://openid.net/specs/openid-connect-core-1_0.html#AuthRequest">3.1.2.1.  Authentication Request</a>
     * @since 5.2
     */
    private void addNonceParameters(Map<String, Object> attributes, Map<String, Object> additionalParameters) {
        try {
            String nonce = this.secureKeyGenerator.generateKey();
            String nonceHash = createHash(nonce);
            attributes.put(OidcParameterNames.NONCE, nonce);
            additionalParameters.put(OidcParameterNames.NONCE, nonceHash);
        } catch (NoSuchAlgorithmException e) {
            log.warn("Error adding NONCE parameter.", e);
        }
    }

    /**
     * Creates and adds additional PKCE parameters for use in the OAuth 2.0 Authorization and Access Token Requests
     *
     * @param attributes           where {@link PkceParameterNames#CODE_VERIFIER} is stored for the token request
     * @param additionalParameters where {@link PkceParameterNames#CODE_CHALLENGE} and, usually,
     *                             {@link PkceParameterNames#CODE_CHALLENGE_METHOD} are added to be used in the authorization request.
     * @see <a target="_blank" href="https://tools.ietf.org/html/rfc7636#section-1.1">1.1.  Protocol Flow</a>
     * @see <a target="_blank" href="https://tools.ietf.org/html/rfc7636#section-4.1">4.1.  Client Creates a Code Verifier</a>
     * @see <a target="_blank" href="https://tools.ietf.org/html/rfc7636#section-4.2">4.2.  Client Creates the Code Challenge</a>
     * @since 5.2
     */
    private void addPkceParameters(Map<String, Object> attributes, Map<String, Object> additionalParameters) {
        String codeVerifier = this.secureKeyGenerator.generateKey();
        attributes.put(PkceParameterNames.CODE_VERIFIER, codeVerifier);
        try {
            String codeChallenge = createHash(codeVerifier);
            additionalParameters.put(PkceParameterNames.CODE_CHALLENGE, codeChallenge);
            additionalParameters.put(PkceParameterNames.CODE_CHALLENGE_METHOD, "S256");
        } catch (NoSuchAlgorithmException e) {
            additionalParameters.put(PkceParameterNames.CODE_CHALLENGE, codeVerifier);
        }
    }

    private static String createHash(String value) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(value.getBytes(StandardCharsets.US_ASCII));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
    }
}
