package com.appsmith.server.helpers;

public class StringUtils {
    private StringUtils() {}

    public static String dotted(String... parts) {
        return String.join(".", parts);
    }
}
