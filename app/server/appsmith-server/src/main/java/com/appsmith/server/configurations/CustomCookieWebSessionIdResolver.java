package com.appsmith.server.configurations;

import com.appsmith.server.configurations.ce.CustomCookieWebSessionIdResolverCE;

/**
 * This class is a custom implementation of the CookieWebSessionIdResolver class.
 * It allows us to set the SameSite attribute of the session cookie based on
 * the organization configuration for cross site embedding.
 */
public class CustomCookieWebSessionIdResolver extends CustomCookieWebSessionIdResolverCE {}
