package com.appsmith.external.helpers;

public class StringUtils {
    private StringUtils() {}

    public static String dotted(String... parts) {
        return String.join(".", parts);
    }
}
