package com.appsmith.util;

import java.util.regex.Pattern;

public class PatternUtils {

    /**
     * This pattern is meant to satisfy any of the following formats with the corresponding capture groups:
     * "_$foo$_"          : [ "_$foo$_", "foo", null, null ]
     * "_$foo$_bar"       : [ "_$foo$_bar", "foo", "bar", null ]
     * "_$foo$_bar.baz"   : [ "_$foo$_bar.baz", "foo", "bar", "baz" ]
     */
    public static final Pattern COMPOSITE_ENTITY_PARENT_NAME_PATTERN =
            Pattern.compile("_\\$(.*)\\$_([^.]*(\\.[^.]*))?");
}
