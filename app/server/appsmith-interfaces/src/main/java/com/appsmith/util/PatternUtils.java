package com.appsmith.util;

import java.util.regex.Pattern;

public class PatternUtils {
    public static final Pattern COMPOSITE_ENTITY_PARENT_NAME_PATTERN = Pattern.compile("_\\$(.*)\\$_");
}
