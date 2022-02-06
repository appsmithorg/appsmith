package com.appsmith.external.constants;

public class Authentication {

    // Auth type constants
    public static final String DB_AUTH = "dbAuth";
    public static final String OAUTH2 = "oAuth2";
    public static final String BASIC = "basic";
    public static final String API_KEY = "apiKey";
    public static final String API_KEY_AUTH_TYPE_QUERY_PARAMS = "queryParams";
    public static final String API_KEY_AUTH_TYPE_HEADER = "header";
    public static final String BEARER_TOKEN = "bearerToken";

    // Request parameter names
    public static final String CLIENT_ID = "client_id";
    public static final String CLIENT_SECRET = "client_secret";
    public static final String REDIRECT_URI = "redirect_uri";
    public static final String ACCESS_TOKEN = "access_token";
    public static final String REFRESH_TOKEN = "refresh_token";
    public static final String EXPIRES_AT = "expires_at";
    public static final String EXPIRES_IN = "expires_in";
    public static final String ISSUED_AT = "issued_at";
    public static final String SCOPE = "scope";
    public static final String CODE = "code";
    public static final String GRANT_TYPE = "grant_type";
    public static final String STATE = "state";
    public static final String AUTHORIZATION_URL = "authorization_url";
    public static final String ACCESS_TOKEN_URL = "access_token_url";
    public static final String RESPONSE_TYPE = "response_type";
    public static final String AUDIENCE = "audience";
    public static final String RESOURCE = "resource";

    // Request parameter values
    public static final String AUTHORIZATION_CODE = "authorization_code";
    public static final String CLIENT_CREDENTIALS = "client_credentials";

    // Header names
    public static final String AUTHORIZATION_HEADER = "Authorization";

    // Other constants
    public static final String BEARER_HEADER_PREFIX = "Bearer";
    public static final String BASIC_HEADER_PREFIX = "Basic ";

    // Response codes
    public static final String SUCCESS = "success";
}
