package com.appsmith.server.constants;

public class RateLimitConstants {
    public static final String RATE_LIMIT_REACHED_ACCOUNT_SUSPENDED =
            "Your account is suspended for 24 hours. Please reset your password to continue";
    public static final String BUCKET_KEY_FOR_LOGIN_API = "login";
    public static final String BUCKET_KEY_FOR_MCP_AUTHENTICATION = "mcp_authentication";
    public static final String BUCKET_KEY_FOR_TEST_DATASOURCE_API = "test_datasource_or_execute_query";

    // Per-email throttle for the unauthenticated resend-email-verification endpoint (anti-abuse).
    public static final String BUCKET_KEY_FOR_RESEND_EMAIL_VERIFICATION_API = "resend_email_verification";

    // Per-user throttle for the Ask AI assistant. Every request spends the organization's own third-party LLM
    // credits, and the endpoint is reachable by any authenticated organization member, so an unthrottled loop is a
    // direct financial denial-of-wallet against the operator as well as sustained outbound load on the instance.
    public static final String BUCKET_KEY_FOR_AI_ASSISTANT_API = "ai_assistant_request";

    public static final String RATE_LIMIT_REACHED_AI_ASSISTANT =
            "Too many AI requests. Please wait a moment and try again.";
}
