package com.appsmith.server.configurations;


import com.appsmith.server.authentication.handlers.AccessDeniedHandler;
import com.appsmith.server.authentication.handlers.CustomServerOAuth2AuthorizationRequestResolver;
import com.appsmith.server.authentication.handlers.LogoutSuccessHandler;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.helpers.RedirectHelper;
import com.appsmith.server.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
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
import java.util.HashSet;

import static com.appsmith.server.constants.Url.ACTION_COLLECTION_URL;
import static com.appsmith.server.constants.Url.ACTION_URL;
import static com.appsmith.server.constants.Url.APPLICATION_URL;
import static com.appsmith.server.constants.Url.PAGE_URL;
import static com.appsmith.server.constants.Url.USER_URL;
import static java.time.temporal.ChronoUnit.DAYS;

@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {

    @Autowired
    private UserService userService;

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
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http
                // This picks up the configurationSource from the bean corsConfigurationSource()
                .csrf().disable()
                .anonymous().principal(createAnonymousUser())
                .and()
                // This returns 401 unauthorized for all requests that are not authenticated but authentication is required
                // The client will redirect to the login page if we return 401 as Http status response
                .exceptionHandling()
                    .authenticationEntryPoint(authenticationEntryPoint)
                    .accessDeniedHandler(accessDeniedHandler)
                .and()
                .authorizeExchange()
                // All public URLs that should be served to anonymous users should also be defined in acl.rego file
                // This is because the flow enters AclFilter as well and needs to be whitelisted there
                .matchers(ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, Url.LOGIN_URL),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/super"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/forgotPassword"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/verifyPasswordResetToken"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.PUT, USER_URL + "/resetPassword"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/invite/verify"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.PUT, USER_URL + "/invite/confirm"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/me"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ACTION_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, ACTION_COLLECTION_URL + "/view"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, PAGE_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, APPLICATION_URL + "/**"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, ACTION_URL + "/execute")
                )
                .permitAll()
                .pathMatchers("/public/**", "/oauth2/**").permitAll()
                .anyExchange()
                .authenticated()
                .and().httpBasic()
                .and().formLogin()
                .loginPage(Url.LOGIN_URL)
                .authenticationEntryPoint(authenticationEntryPoint)
                .requiresAuthenticationMatcher(ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, Url.LOGIN_URL))
                .authenticationSuccessHandler(authenticationSuccessHandler)
                .authenticationFailureHandler(authenticationFailureHandler)

                // For Github SSO Login, check transformation class: CustomOAuth2UserServiceImpl
                // For Google SSO Login, check transformation class: CustomOAuth2UserServiceImpl
                .and().oauth2Login()
                .authorizationRequestResolver(new CustomServerOAuth2AuthorizationRequestResolver(reactiveClientRegistrationRepository, commonConfig, redirectHelper))
                .authenticationSuccessHandler(authenticationSuccessHandler)
                .authenticationFailureHandler(authenticationFailureHandler)
                .authorizedClientRepository(new ClientUserRepository(userService, commonConfig))
                .and().logout()
                .logoutUrl(Url.LOGOUT_URL)
                .logoutSuccessHandler(new LogoutSuccessHandler(objectMapper))
                .and().build();
    }

    /**
     * This bean configures the parameters that need to be set when a Cookie is created for a logged in user
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

    private User createAnonymousUser() {
        User user = new User();
        user.setName(FieldName.ANONYMOUS_USER);
        user.setEmail(FieldName.ANONYMOUS_USER);
        user.setCurrentOrganizationId("");
        user.setOrganizationIds(new HashSet<>());
        user.setIsAnonymous(true);
        return user;
    }
}
