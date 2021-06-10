package com.appsmith.server.helpers;

public class NumberUtils {
    public static int parseInteger(String str, int minValue, int defaultValue) {
        try {
            int i = Integer.parseInt(str);
            return Math.max(i, minValue);
        } catch(Exception e) {
            return defaultValue;
        }
    }
}
