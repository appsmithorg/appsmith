package com.appsmith.external.constants.spans;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class LoginSpan {
    public static final String LOGIN_FAILURE = APPSMITH_SPAN_PREFIX + "login_failure";
    public static final String LOGIN_ATTEMPT = APPSMITH_SPAN_PREFIX + "login_total";
}
