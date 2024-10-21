package com.appsmith.server.helpers;

public class AppsmithClassUtils {

    /**
     * This method checks if the given class is a projection class. Projection classes are classes that are used to project data from one form to another.
     * @param clazz The class to be checked
     * @return      True if the class is a projection class, false otherwise
     */
    public static boolean isAppsmithProjections(Class<?> clazz) {
        return clazz.getPackageName().matches(".*appsmith.*projections");
    }

    /**
     * This method checks if the given class is an Appsmith defined class.
     * @param clazz The class to be checked
     * @return      True if the class is an Appsmith defined class, false otherwise
     */
    public static boolean isAppsmithDefinedClass(Class<?> clazz) {
        return clazz.getPackageName().startsWith("com.appsmith");
    }
}
