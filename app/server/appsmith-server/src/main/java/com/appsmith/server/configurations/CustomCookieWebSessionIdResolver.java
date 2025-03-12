package com.appsmith.server.configurations;

import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.session.CookieWebSessionIdResolver;

import java.time.Duration;

import static java.time.temporal.ChronoUnit.DAYS;

/**
 * This class is a custom implementation of the CookieWebSessionIdResolver class.
 * It allows us to set the SameSite attribute of the session cookie based on
 * the organization configuration for cross site embedding.
 */
public class CustomCookieWebSessionIdResolver extends CookieWebSessionIdResolver {

    public static final String LAX = "Lax";

    public CustomCookieWebSessionIdResolver() {
        // Set default cookie attributes

        // Setting the max age to 30 days so that the cookie doesn't expire on browser close
        // If the max age is not set, some browsers will default to deleting the cookies on session close.
        this.setCookieMaxAge(Duration.of(30, DAYS));
        this.addCookieInitializer((builder) -> builder.path("/"));
    }

    @Override
    public void setSessionId(ServerWebExchange exchange, String id) {
        // Add the appropriate SameSite attribute based on the exchange attribute
        addCookieInitializer((builder) -> builder.sameSite(LAX).secure(true));
        super.setSessionId(exchange, id);
    }
}
