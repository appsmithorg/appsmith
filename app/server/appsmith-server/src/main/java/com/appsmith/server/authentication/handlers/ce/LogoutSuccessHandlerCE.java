package com.appsmith.server.authentication.handlers.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.AnalyticsService;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.server.DefaultServerRedirectStrategy;
import org.springframework.security.web.server.ServerRedirectStrategy;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.logout.RedirectServerLogoutSuccessHandler;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;
import org.springframework.web.util.UriComponents;
import org.springframework.web.util.UriComponentsBuilder;
import reactor.core.publisher.Mono;

import java.net.URI;

@Slf4j
public class LogoutSuccessHandlerCE implements ServerLogoutSuccessHandler {

    private final AnalyticsService analyticsService;

    @Getter(AccessLevel.PROTECTED)
    private final ServerRedirectStrategy redirectStrategy = new DefaultServerRedirectStrategy();

    @Getter(AccessLevel.PROTECTED)
    private final RedirectServerLogoutSuccessHandler redirectServerLogoutSuccessHandler =
            new RedirectServerLogoutSuccessHandler();

    @Getter(AccessLevel.PROTECTED)
    private final String postLogoutRedirectUri = "/user/login";

    public LogoutSuccessHandlerCE(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Override
    public Mono<Void> onLogoutSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        log.debug("In the logout success handler");

        Mono<Void> postLogoutRedirectionMono = this.generatePostLogoutRedirectUri(webFilterExchange, authentication)
                .flatMap(logoutRedirectUri -> this.getRedirectStrategy()
                        .sendRedirect(webFilterExchange.getExchange(), URI.create(logoutRedirectUri)));
        return analyticsService
                .sendObjectEvent(AnalyticsEvents.LOGOUT, (User) authentication.getPrincipal())
                .then(postLogoutRedirectionMono);
    }

    protected Mono<String> generatePostLogoutRedirectUri(
            WebFilterExchange webFilterExchange, Authentication authentication) {
        return Mono.just(postLogoutRedirectUri(webFilterExchange.getExchange().getRequest()));
    }

    protected static UriComponents getUriComponents(ServerHttpRequest request) {
        return UriComponentsBuilder.fromUri(request.getURI())
                .replacePath(request.getPath().contextPath().value())
                .replaceQuery(null)
                .fragment(null)
                .build();
    }

    protected String postLogoutRedirectUri(ServerHttpRequest request) {
        UriComponents uriComponents = getUriComponents(request);
        String scheme = uriComponents.getScheme();
        String host = uriComponents.getHost();
        return UriComponentsBuilder.newInstance()
                .scheme((scheme != null) ? scheme : "")
                .host((host != null) ? host : "")
                .path(this.getPostLogoutRedirectUri())
                .build()
                .toUriString();
    }
}
