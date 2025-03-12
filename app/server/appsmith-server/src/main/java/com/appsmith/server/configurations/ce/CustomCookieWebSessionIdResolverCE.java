package com.appsmith.server.configurations.ce;

import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.session.CookieWebSessionIdResolver;

import java.time.Duration;

import static java.time.temporal.ChronoUnit.DAYS;

/**
 * This class is a custom implementation of the CookieWebSessionIdResolver class.
 * It allows us to set the SameSite attribute of the session cookie based on
 * the organization configuration for cross site embedding.
 */
public class CustomCookieWebSessionIdResolverCE extends CookieWebSessionIdResolver {

    public static final String LAX = "Lax";

    public CustomCookieWebSessionIdResolverCE() {
        // Set default cookie attributes

        // Setting the max age to 30 days so that the cookie doesn't expire on browser close
        // If the max age is not set, some browsers will default to deleting the cookies on session close.
        this.setCookieMaxAge(Duration.of(30, DAYS));
        this.addCookieInitializer((builder) -> builder.path("/"));
    }

    @Override
    public void setSessionId(ServerWebExchange exchange, String id) {
        addCookieInitializer();
        super.setSessionId(exchange, id);
    }

    protected void addCookieInitializer() {
        // Add the appropriate SameSite attribute based on the exchange attribute
        addCookieInitializer((builder) -> builder.sameSite(LAX).secure(true));
    }
}
