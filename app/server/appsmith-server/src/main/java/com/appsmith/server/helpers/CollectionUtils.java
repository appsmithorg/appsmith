package com.appsmith.server.helpers;

import java.util.Collection;
import java.util.Map;

public class CollectionUtils {

    /**
     * Helper function to check if a collection is null or empty.
     * @param c
     * @return
     */
    public static boolean isNullOrEmpty( final Collection< ? > c ) {
        return (c == null || c.isEmpty());
    }

    /**
     * Helper function to check if a map is null or empty
     * @param m
     * @return
     */
    public static boolean isNullOrEmpty( final Map< ?, ? > m ) {
        return (m == null || m.isEmpty());
    }

}
