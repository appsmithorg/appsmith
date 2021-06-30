package com.appsmith.server.helpers;

public class NumberUtils {
    /**
     * Parses an integer from a string. If the provided string is not an integer, it'll return the default value instead.
     * If the parsed integer is less than minValue, it'll return the default value
     * @param str
     * @param minValue
     * @param defaultValue
     * @return parsed integer or default value depending on the conditions.
     */
    public static int parseInteger(String str, int minValue, int defaultValue) {
        try {
            int i = Integer.parseInt(str);
            if(i < minValue) {
                return defaultValue;
            }
            return i;
        } catch(Exception e) {
            return defaultValue;
        }
    }
}
