package com.appsmith.server.helpers;

public class AppsmithClassUtils {

    public static boolean isAppsmithProjections(Class<?> clazz) {
        return clazz.getPackageName().matches(".*appsmith.*projections");
    }

    public static boolean isAppsmithDefinedClass(Class<?> clazz) {
        return clazz.getPackageName().startsWith("com.appsmith");
    }
}
