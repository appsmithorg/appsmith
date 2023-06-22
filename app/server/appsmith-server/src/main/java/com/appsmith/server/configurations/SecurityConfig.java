package com.appsmith.server.configurations;


import com.appsmith.server.authentication.converters.ApiKeyAuthenticationConverter;
import com.appsmith.server.authentication.handlers.AccessDeniedHandler;
import com.appsmith.server.authentication.handlers.CustomServerOAuth2AuthorizationRequestResolver;
import com.appsmith.server.authentication.handlers.LogoutSuccessHandler;
import com.appsmith.server.authentication.managers.ApiKeyAuthenticationManager;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.filters.AirgapUnsupportedPathFilter;
import com.appsmith.server.filters.CSRFFilter;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.observation.ObservationRegistry;
import org.apache.commons.lang3.StringUtils;
import org.checkerframework.checker.units.qual.A;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DelegatingReactiveAuthenticationManager;
import org.springframework.security.authentication.ObservationReactiveAuthenticationManager;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.authentication.ReactiveOidcIdTokenDecoderFactory;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoderFactory;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.authentication.ServerAuthenticationEntryPointFailureHandler;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;
import org.springframework.web.server.adapter.ForwardedHeaderTransformer;
import org.springframework.web.server.session.CookieWebSessionIdResolver;
import org.springframework.web.server.session.WebSessionIdResolver;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;

import static com.appsmith.server.constants.Url.ACTION_COLLECTION_URL;
import static com.appsmith.server.constants.Url.ACTION_URL;
import static com.appsmith.server.constants.Url.ANALYTICS_URL;
import static com.appsmith.server.constants.Url.APPLICATION_URL;
import static com.appsmith.server.constants.Url.ASSET_URL;
import static com.appsmith.server.constants.Url.CUSTOM_JS_LIB_URL;
import static com.appsmith.server.constants.Url.PAGE_URL;
import static com.appsmith.server.constants.Url.PLUGIN_URL;
import static com.appsmith.server.constants.Url.TENANT_URL;
import static com.appsmith.server.constants.Url.THEME_URL;
import static com.appsmith.server.constants.Url.USAGE_PULSE_URL;
import static com.appsmith.server.constants.Url.USER_URL;
import static java.time.temporal.ChronoUnit.DAYS;

@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
@Configuration
public class SecurityConfig {

    private ReactiveAuthenticationManager reactiveAuthenticationManager;

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
    AirgapInstanceConfig airgapInstanceConfig;

    @Value("${appsmith.oidc.jwt-signing-algo}")
    private String oidcJwtSigningAlgorithm;

    @Autowired
    private ReactiveUserDetailsService reactiveUserDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObservationRegistry observationRegistry;

    /**
     * This routerFunction is required to map /public/** endpoints to the src/main/resources/public folder
     * This is to allow static resources to be served by the server. Couldn't find an easier way to do this,
     * hence using RouterFunctions to implement this feature.
     * <p>
     * Future folks: Please check out links:
     * - https://www.baeldung.com/spring-webflux-static-content
     * - https://docs.spring.io/spring/docs/current/spring-framework-reference/web-reactive.html#webflux-config-static-resources
     * - Class ResourceHandlerRegistry
     * for details. If you figure out a cleaner approach, please modify this function
     *
     * @return
     */
    @Bean
    public RouterFunction<ServerResponse> publicRouter() {
        return RouterFunctions
                .resources("/public/**", new ClassPathResource("public/"));
    }

    @Bean
    public ForwardedHeaderTransformer forwardedHeaderTransformer() {
        return new ForwardedHeaderTransformer();
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http,
                                                         ApiKeyAuthorisationManager apiKeyAuthorisationManager,
                                                         ApiKeyAuthenticationConverter apiKeyAuthenticationConverter) {
        ServerAuthenticationEntryPointFailureHandler failureHandler = new ServerAuthenticationEntryPointFailureHandler(authenticationEntryPoint);
        ApiKeyAuthenticationManager apiKeyAuthenticationManager = new ApiKeyAuthenticationManager();
        AuthenticationWebFilter apiKeyAuthenticationWebFilter = new AuthenticationWebFilter(apiKeyAuthenticationManager);
        apiKeyAuthenticationWebFilter.setServerAuthenticationConverter(apiKeyAuthenticationConverter);

        return http
                // The native CSRF solution doesn't work with WebFlux, yet, but only for WebMVC. So we make our own.
                .csrf().disable()
                .addFilterAt(new CSRFFilter(), SecurityWebFiltersOrder.CSRF)
                .addFilterAfter(new AirgapUnsupportedPathFilter(airgapInstanceConfig), SecurityWebFiltersOrder.CSRF)
                // Add a filter at the authentication step, which will convert the x-appsmith-key value to a valid principal
                // which can be used for authorisation.
                .addFilterAt(apiKeyAuthenticationWebFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                .authenticationManager(authenticationManager())
                .anonymous().principal(createAnonymousUser())
                .and()
                // This returns 401 unauthorized for all requests that are not authenticated but authentication is required
                // The client will redirect to the login page if we return 401 as Http status response
                .exceptionHandling()
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
                .and()
                .authorizeExchange()
                // Allow cloud-services to install a remote plugin
                .matchers(ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, PLUGIN_URL + "/remote/install"))
                .access(apiKeyAuthorisationManager)
                .matchers(ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, Url.LOGIN_URL),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, Url.HEALTH_CHECK),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/super"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/forgotPassword"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/verifyPasswordResetToken"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.PUT, USER_URL + "/resetPassword"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/invite/verify"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.PUT, USER_URL + "/invite/confirm"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/me"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/features"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ASSET_URL + "/*"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ACTION_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ACTION_COLLECTION_URL + "/view"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, PAGE_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, THEME_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, ACTION_URL + "/execute"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, TENANT_URL + "/current"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, ANALYTICS_URL + "/event"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USAGE_PULSE_URL),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, CUSTOM_JS_LIB_URL + "/*/view")
                )
                .permitAll()
                .pathMatchers("/public/**", "/oauth2/**", "/actuator/**").permitAll()
                .anyExchange()
                .authenticated()
                .and()
                .httpBasic(httpBasicSpec -> httpBasicSpec.authenticationFailureHandler(failureHandler))
                .formLogin(formLoginSpec -> formLoginSpec.authenticationFailureHandler(failureHandler)
                        .loginPage(Url.LOGIN_URL)
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .requiresAuthenticationMatcher(ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, Url.LOGIN_URL))
                        .authenticationSuccessHandler(authenticationSuccessHandler)
                        .authenticationFailureHandler(authenticationFailureHandler))

                // For Github SSO Login, check transformation class: CustomOAuth2UserServiceImpl
                // For Google SSO Login, check transformation class: CustomOAuth2UserServiceImpl
                .oauth2Login(oAuth2LoginSpec -> oAuth2LoginSpec.authenticationFailureHandler(failureHandler)
                        .authorizationRequestResolver(new CustomServerOAuth2AuthorizationRequestResolver(reactiveClientRegistrationRepository, commonConfig, redirectHelper))
                        .authenticationSuccessHandler(authenticationSuccessHandler)
                        .authenticationFailureHandler(authenticationFailureHandler)
                        .authorizedClientRepository(new ClientUserRepository(userService, commonConfig)))
                .logout()
                .logoutUrl(Url.LOGOUT_URL)
                .logoutSuccessHandler(new LogoutSuccessHandler(objectMapper, analyticsService))
                .and()
                .build();
    }

    /**
     * This code has been partially duplicated from {@link org.springframework.security.config.annotation.web.reactive.ServerHttpSecurityConfiguration}'s
     * {@code authenticationManager()} method. This was done because creating a bean for {@link ApiKeyAuthenticationManager} was overriding the authentication manager
     * being used by the {@link ServerHttpSecurity} bean. This lead to a break in the current authentication which are currently implemented.
     *
     * <ol>
     *     Reactive Authentication Managers created:
     *     <li>
     *         An instance of {@link UserDetailsRepositoryReactiveAuthenticationManager} using beans for {@link ReactiveUserDetailsService},
     *         {@link PasswordEncoder} and {@link ObservationRegistry}.
     *     </li>
     *     <li>
     *         An instance of {@link ApiKeyAuthenticationManager}.
     *     </li>
     * </ol>
     *
     * @return Delegated list of Authentication Managers used for authentication and authorisation.
     */
    private ReactiveAuthenticationManager authenticationManager() {
        List<ReactiveAuthenticationManager> reactiveAuthenticationManagers = new ArrayList<>();
        if (this.reactiveUserDetailsService != null) {
            UserDetailsRepositoryReactiveAuthenticationManager manager = new UserDetailsRepositoryReactiveAuthenticationManager(this.reactiveUserDetailsService);
            if (this.passwordEncoder != null) {
                manager.setPasswordEncoder(this.passwordEncoder);
            }
            if (!this.observationRegistry.isNoop()) {
                reactiveAuthenticationManagers.add(new ObservationReactiveAuthenticationManager(this.observationRegistry, manager));
            } else {
                reactiveAuthenticationManagers.add(manager);
            }
        }
        reactiveAuthenticationManagers.add(new ApiKeyAuthenticationManager());
        return new DelegatingReactiveAuthenticationManager(reactiveAuthenticationManagers);
    }

    /**
     * This bean configures the parameters that need to be set when a Cookie is created for a logged in user
     *
     * @return
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

    @Bean
    public ReactiveJwtDecoderFactory<ClientRegistration> idTokenDecoderFactory() {
        ReactiveOidcIdTokenDecoderFactory idTokenDecoderFactory = new ReactiveOidcIdTokenDecoderFactory();
        idTokenDecoderFactory.setJwsAlgorithmResolver(clientRegistration -> {
            String clientName = clientRegistration.getClientName();
            if (clientName.equals("oidc")) {
                if (!StringUtils.isEmpty(oidcJwtSigningAlgorithm)) {
                    SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.from(oidcJwtSigningAlgorithm);
                    if (signatureAlgorithm != null) {
                        return signatureAlgorithm;
                    }
                }
            }

            // Default to RS256 for all other client registrations.
            return SignatureAlgorithm.RS256;
        });
        return idTokenDecoderFactory;
    }


    private User createAnonymousUser() {
        User user = new User();
        user.setName(FieldName.ANONYMOUS_USER);
        user.setEmail(FieldName.ANONYMOUS_USER);
        user.setCurrentWorkspaceId("");
        user.setWorkspaceIds(new HashSet<>());
        user.setIsAnonymous(true);
        return user;
    }
}
