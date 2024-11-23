package com.appsmith.server.configurations;

import com.appsmith.external.exceptions.ErrorDTO;
import com.appsmith.server.authentication.handlers.AccessDeniedHandler;
import com.appsmith.server.authentication.handlers.CustomServerOAuth2AuthorizationRequestResolver;
import com.appsmith.server.authentication.handlers.LogoutSuccessHandler;
import com.appsmith.server.authentication.oauth2clientrepositories.CustomOauth2ClientRepositoryManager;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithErrorCode;
import com.appsmith.server.filters.CSRFFilter;
import com.appsmith.server.filters.ConditionalFilter;
import com.appsmith.server.filters.LoginRateLimitFilter;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.ratelimiting.RateLimitService;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.UserService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.InvalidMediaTypeException;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.authentication.ServerAuthenticationEntryPointFailureHandler;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.util.matcher.PathPatternParserServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatcher;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilterChain;
import org.springframework.web.server.adapter.ForwardedHeaderTransformer;
import org.springframework.web.server.session.CookieWebSessionIdResolver;
import org.springframework.web.server.session.WebSessionIdResolver;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;

import static com.appsmith.server.constants.Url.ACTION_COLLECTION_URL;
import static com.appsmith.server.constants.Url.ACTION_URL;
import static com.appsmith.server.constants.Url.APPLICATION_URL;
import static com.appsmith.server.constants.Url.ASSET_URL;
import static com.appsmith.server.constants.Url.CUSTOM_JS_LIB_URL;
import static com.appsmith.server.constants.Url.PAGE_URL;
import static com.appsmith.server.constants.Url.PRODUCT_ALERT;
import static com.appsmith.server.constants.Url.TENANT_URL;
import static com.appsmith.server.constants.Url.THEME_URL;
import static com.appsmith.server.constants.Url.USAGE_PULSE_URL;
import static com.appsmith.server.constants.Url.USER_URL;
import static com.appsmith.server.constants.ce.UrlCE.CONSOLIDATED_API_URL;
import static java.time.temporal.ChronoUnit.DAYS;

@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@Configuration
public class SecurityConfig {

    @Autowired
    private UserService userService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private CommonConfig commonConfig;

    @Autowired
    private ServerAuthenticationSuccessHandler authenticationSuccessHandler;

    @Autowired
    private ServerAuthenticationFailureHandler authenticationFailureHandler;

    @Autowired
    private ServerAuthenticationEntryPoint authenticationEntryPoint;

    @Autowired
    private ReactiveClientRegistrationRepository reactiveClientRegistrationRepository;

    @Autowired
    private AccessDeniedHandler accessDeniedHandler;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RedirectHelper redirectHelper;

    @Autowired
    private RateLimitService rateLimitService;

    @Autowired
    private CustomOauth2ClientRepositoryManager oauth2ClientManager;

    @Autowired
    private ProjectProperties projectProperties;

    @Value("${appsmith.internal.password}")
    private String INTERNAL_PASSWORD;

    private static final String INTERNAL = "INTERNAL";

    /**
     * This routerFunction is required to map /public/** endpoints to the src/main/resources/public folder
     * This is to allow static resources to be served by the server. Couldn't find an easier way to do this,
     * hence using RouterFunctions to implement this feature.
     * <p>
     * Future folks: Please check out links:
     * - <a href="https://www.baeldung.com/spring-webflux-static-content">...</a>
     * - <a href="https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-static-resources">...</a>
     * - Class ResourceHandlerRegistry
     * for details. If you figure out a cleaner approach, please modify this function
     */
    @Bean
    public RouterFunction<ServerResponse> publicRouter() {
        return RouterFunctions.resources("/public/**", new ClassPathResource("public/"));
    }

    @Bean
    public ForwardedHeaderTransformer forwardedHeaderTransformer() {
        return new ForwardedHeaderTransformer();
    }

    @Order(Ordered.HIGHEST_PRECEDENCE)
    @Bean
    public SecurityWebFilterChain internalWebFilterChain(ServerHttpSecurity http) {
        return http.securityMatcher(new PathPatternParserServerWebExchangeMatcher("/actuator/**"))
                .httpBasic(httpBasicSpec -> httpBasicSpec.authenticationManager(authentication -> {
                    if (INTERNAL_PASSWORD.equals(authentication.getCredentials().toString())) {
                        return Mono.just(UsernamePasswordAuthenticationToken.authenticated(
                                authentication.getPrincipal(),
                                authentication.getCredentials(),
                                List.of(new SimpleGrantedAuthority(INTERNAL))));
                    } else {
                        return Mono.just(UsernamePasswordAuthenticationToken.unauthenticated(
                                authentication.getPrincipal(), authentication.getCredentials()));
                    }
                }))
                .authorizeExchange(authorizeExchangeSpec ->
                        authorizeExchangeSpec.anyExchange().hasAnyAuthority(INTERNAL))
                .build();
    }

    @Bean
    @SuppressWarnings("Convert2MethodRef") // Helps readability.
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        ServerAuthenticationEntryPointFailureHandler failureHandler =
                new ServerAuthenticationEntryPointFailureHandler(authenticationEntryPoint);

        return http.addFilterAt(this::sanityCheckFilter, SecurityWebFiltersOrder.FIRST)
                // The native CSRF solution doesn't work with WebFlux, yet, but only for WebMVC. So we make our own.
                .csrf(csrfSpec -> csrfSpec.disable())
                .addFilterAt(new CSRFFilter(objectMapper), SecurityWebFiltersOrder.CSRF)
                // Default security headers configuration from
                // https://docs.spring.io/spring-security/site/docs/5.0.x/reference/html/headers.html
                .headers(headerSpec -> headerSpec
                        // Disabled here because add it in Caddy instead.
                        .contentTypeOptions(options -> options.disable())
                        // Disabled because we use CSP's `frame-ancestors` instead.
                        .frameOptions(options -> options.disable()))
                .anonymous(anonymousSpec -> anonymousSpec.principal(createAnonymousUser()))
                // This returns 401 unauthorized for all requests that are not authenticated but authentication is
                // required
                // The client will redirect to the login page if we return 401 as Http status response
                .exceptionHandling(exceptionHandlingSpec -> exceptionHandlingSpec
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeExchange(authorizeExchangeSpec -> authorizeExchangeSpec
                        // The following endpoints are allowed to be accessed without authentication
                        .matchers(
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, Url.LOGIN_URL),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, Url.HEALTH_CHECK),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/super"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/forgotPassword"),
                                ServerWebExchangeMatchers.pathMatchers(
                                        HttpMethod.GET, USER_URL + "/verifyPasswordResetToken"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.PUT, USER_URL + "/resetPassword"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/invite/verify"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.PUT, USER_URL + "/invite/confirm"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/me"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, "/v3/**"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/features"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ASSET_URL + "/*"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ACTION_URL + "/**"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ACTION_COLLECTION_URL + "/view"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, PAGE_URL + "/**"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/**"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, THEME_URL + "/**"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, ACTION_URL + "/execute"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, TENANT_URL + "/current"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USAGE_PULSE_URL),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, CUSTOM_JS_LIB_URL + "/*/view"),
                                ServerWebExchangeMatchers.pathMatchers(
                                        HttpMethod.POST, USER_URL + "/resendEmailVerification"),
                                ServerWebExchangeMatchers.pathMatchers(
                                        HttpMethod.POST, USER_URL + "/verifyEmailVerificationToken"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, PRODUCT_ALERT + "/alert"),
                                ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, CONSOLIDATED_API_URL + "/view"))
                        .permitAll()
                        .pathMatchers("/public/**", "/oauth2/**")
                        .permitAll()
                        .anyExchange()
                        .authenticated())
                // Add Pre Auth rate limit filter before authentication filter
                .addFilterBefore(
                        new ConditionalFilter(new LoginRateLimitFilter(rateLimitService), Url.LOGIN_URL),
                        SecurityWebFiltersOrder.FORM_LOGIN)
                .httpBasic(httpBasicSpec -> httpBasicSpec.authenticationFailureHandler(failureHandler))
                .formLogin(formLoginSpec -> formLoginSpec
                        .authenticationFailureHandler(failureHandler)
                        .loginPage(Url.LOGIN_URL)
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .requiresAuthenticationMatcher(exchange -> {
                            final ServerHttpRequest request = exchange.getRequest();
                            return HttpMethod.POST.equals(request.getMethod())
                                            && Url.LOGIN_URL.equals(
                                                    request.getPath().toString())
                                            && MediaType.APPLICATION_FORM_URLENCODED.equalsTypeAndSubtype(
                                                    request.getHeaders().getContentType())
                                    ? ServerWebExchangeMatcher.MatchResult.match()
                                    : ServerWebExchangeMatcher.MatchResult.notMatch();
                        })
                        .authenticationSuccessHandler(authenticationSuccessHandler)
                        .authenticationFailureHandler(authenticationFailureHandler))
                // For Github SSO Login, check transformation class: CustomOAuth2UserServiceImpl
                // For Google SSO Login, check transformation class: CustomOAuth2UserServiceImpl
                .oauth2Login(oAuth2LoginSpec -> oAuth2LoginSpec
                        .authenticationFailureHandler(failureHandler)
                        .authorizationRequestResolver(new CustomServerOAuth2AuthorizationRequestResolver(
                                reactiveClientRegistrationRepository,
                                commonConfig,
                                redirectHelper,
                                oauth2ClientManager))
                        .authenticationSuccessHandler(authenticationSuccessHandler)
                        .authenticationFailureHandler(authenticationFailureHandler)
                        .authorizedClientRepository(new ClientUserRepository(userService, commonConfig)))
                .logout(logoutSpec -> logoutSpec
                        .logoutUrl(Url.LOGOUT_URL)
                        .logoutSuccessHandler(new LogoutSuccessHandler(objectMapper, analyticsService)))
                .build();
    }

    /**
     * This bean configures the parameters that need to be set when a Cookie is created for a logged in user
     */
    @Bean
    public WebSessionIdResolver webSessionIdResolver() {
        CookieWebSessionIdResolver resolver = new CookieWebSessionIdResolver();
        // Setting the max age to 30 days so that the cookie doesn't expire on browser close
        // If the max age is not set, some browsers will default to deleting the cookies on session close.
        resolver.setCookieMaxAge(Duration.of(30, DAYS));
        resolver.addCookieInitializer((builder) -> builder.path("/"));
        resolver.addCookieInitializer((builder) -> builder.sameSite("Lax"));
        return resolver;
    }

    private User createAnonymousUser() {
        User user = new User();
        user.setName(FieldName.ANONYMOUS_USER);
        user.setEmail(FieldName.ANONYMOUS_USER);
        user.setWorkspaceIds(new HashSet<>());
        user.setIsAnonymous(true);
        return user;
    }

    private Mono<Void> sanityCheckFilter(ServerWebExchange exchange, WebFilterChain chain) {
        final HttpHeaders headers = exchange.getRequest().getHeaders();

        // 1. Check if the content-type is valid at all. Mostly just checks if it contains a `/`.
        MediaType contentType;
        try {
            contentType = headers.getContentType();
        } catch (InvalidMediaTypeException e) {
            return writeErrorResponse(exchange, chain, e.getMessage());
        }

        // 2. Check if it's a content-type our controllers actually work with.
        if (contentType != null
                && !MediaType.APPLICATION_JSON.equalsTypeAndSubtype(contentType)
                && !MediaType.APPLICATION_FORM_URLENCODED.equalsTypeAndSubtype(contentType)
                && !MediaType.MULTIPART_FORM_DATA.equalsTypeAndSubtype(contentType)) {
            return writeErrorResponse(exchange, chain, "Unsupported Content-Type");
        }

        // 3. Check Appsmith version, if present. Not making this a mandatory check for now, but reconsider later.
        final String versionHeaderValue = headers.getFirst("X-Appsmith-Version");
        if (versionHeaderValue != null && !projectProperties.getVersion().equals(versionHeaderValue)) {
            return writeErrorResponse(
                    exchange,
                    chain,
                    new ErrorDTO(
                            AppsmithErrorCode.VERSION_MISMATCH.getCode(),
                            "Appsmith version mismatch, expected '" + projectProperties.getVersion() + "'"));
        }

        return chain.filter(exchange);
    }

    private Mono<Void> writeErrorResponse(ServerWebExchange exchange, WebFilterChain chain, String message) {
        final ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.BAD_REQUEST);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        try {
            return response.writeWith(Mono.just(response.bufferFactory()
                    .wrap(objectMapper.writeValueAsBytes(
                            new ResponseDTO<>(response.getStatusCode().value(), null, message, false)))));
        } catch (JsonProcessingException ex) {
            return chain.filter(exchange);
        }
    }

    private Mono<Void> writeErrorResponse(ServerWebExchange exchange, WebFilterChain chain, ErrorDTO error) {
        final ServerHttpResponse response = exchange.getResponse();
        final HttpStatus status = HttpStatus.BAD_REQUEST;
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        try {
            return response.writeWith(Mono.just(response.bufferFactory()
                    .wrap(objectMapper.writeValueAsBytes(new ResponseDTO<>(status.value(), error)))));
        } catch (JsonProcessingException ex) {
            return chain.filter(exchange);
        }
    }
}
