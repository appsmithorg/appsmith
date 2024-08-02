package com.appsmith.external.constants.spans.ce;

import static com.appsmith.external.constants.spans.BaseSpan.APPSMITH_SPAN_PREFIX;

public class UserSpanCE {
    public static final String USER_SPAN = APPSMITH_SPAN_PREFIX + "user.";
    public static final String CHECK_SUPER_USER_SPAN = USER_SPAN + "check_super_user";
    public static final String FETCH_ALL_PERMISSION_GROUPS_OF_USER_SPAN =
            USER_SPAN + "fetch_all_permission_groups_of_user";
}
