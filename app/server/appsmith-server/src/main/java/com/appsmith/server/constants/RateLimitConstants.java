package com.appsmith.server.constants;

public class RateLimitConstants {
    public static final String RATE_LIMIT_REACHED = "Rate limit reached. Please try again later.";
    public static final String RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED = "Your account is suspended for 24 hours.";
    public static final String RATE_LIMIT_ACCOUNT_SUSPENDED_WARNING_MESSAGE =
            "After 5 consecutive failed logins, your account will be suspended for 24 hours.";

    public static final String BUCKET_KEY_FOR_LOGIN_API = "login";
}
