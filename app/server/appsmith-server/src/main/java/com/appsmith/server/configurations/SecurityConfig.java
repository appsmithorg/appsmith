package com.appsmith.server.configurations;


import com.appsmith.server.authentication.handlers.CustomServerOAuth2AuthorizationRequestResolver;
import com.appsmith.server.authentication.handlers.LogoutSuccessHandler;
import com.appsmith.server.services.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.ServerAuthenticationEntryPoint;
import org.springframework.security.web.server.authentication.ServerAuthenticationFailureHandler;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.security.web.server.util.matcher.ServerWebExchangeMatchers;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.reactive.function.server.RouterFunction;
import org.springframework.web.reactive.function.server.RouterFunctions;
import org.springframework.web.reactive.function.server.ServerResponse;

import java.util.Arrays;

import static com.appsmith.server.constants.Url.USER_URL;

@EnableWebFluxSecurity
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
    ObjectMapper objectMapper;

    @Value("${spring.security.oauth2.client.registration.google.redirectUriTemplate}")
    private String oAuth2RedirectUri;

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

    /**
     * This configuration enables CORS requests for the most common HTTP Methods
     *
     * @return
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("*"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        System.out.println("Got the google redirect Uri as: " + oAuth2RedirectUri);
        
        return http
                // This picks up the configurationSource from the bean corsConfigurationSource()
                .cors().and()
                .csrf().disable()
                // This returns 401 unauthorized for all requests that are not authenticated but authentication is required
                // The client will redirect to the login page if we return 401 as Http status response
                .exceptionHandling().authenticationEntryPoint(authenticationEntryPoint)
                .and().authorizeExchange()
                // All public URLs that should be served to anonymous users should also be defined in acl.rego file
                // This is because the flow enters AclFilter as well and needs to be whitelisted there
                .matchers(ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, "/login"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, USER_URL + "/forgotPassword"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/verifyPasswordResetToken"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.PUT, USER_URL + "/resetPassword"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.GET, USER_URL + "/invite/verify"),
                        ServerWebExchangeMatchers.pathMatchers(HttpMethod.PUT, USER_URL + "/invite/confirm"))
                .permitAll()
                .pathMatchers("/public/**").permitAll()
                .anyExchange()
                .authenticated()
                .and().formLogin()
                .authenticationEntryPoint(authenticationEntryPoint)
                .requiresAuthenticationMatcher(ServerWebExchangeMatchers.pathMatchers(HttpMethod.POST, "/login"))
                .authenticationSuccessHandler(authenticationSuccessHandler)
                .authenticationFailureHandler(authenticationFailureHandler)
                .and().oauth2Login()
                .authorizationRequestResolver(new CustomServerOAuth2AuthorizationRequestResolver(reactiveClientRegistrationRepository))
                .authenticationSuccessHandler(authenticationSuccessHandler)
                .authenticationFailureHandler(authenticationFailureHandler)
                .authorizedClientRepository(new ClientUserRepository(userService, commonConfig))
                .and().logout()
                .logoutSuccessHandler(new LogoutSuccessHandler(objectMapper))
                .and().build();
    }

}
