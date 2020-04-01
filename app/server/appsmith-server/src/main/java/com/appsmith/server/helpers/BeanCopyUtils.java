package com.appsmith.server.helpers;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeanWrapper;
import org.springframework.beans.BeanWrapperImpl;
import org.springframework.beans.PropertyAccessorFactory;

import java.beans.PropertyDescriptor;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class BeanCopyUtils {

    private static String[] getNullPropertyNames(Object source) {
        // TODO: The `BeanWrapperImpl` class has been declared to be an internal class. Migrate to using
        //  `PropertyAccessorFactory.forBeanPropertyAccess` instead.
        final BeanWrapper src = new BeanWrapperImpl(source);
        java.beans.PropertyDescriptor[] pds = src.getPropertyDescriptors();

        Set<String> emptyNames = new HashSet<String>();
        for (java.beans.PropertyDescriptor pd : pds) {
            Object srcValue = src.getPropertyValue(pd.getName());
            if (srcValue == null) {
                emptyNames.add(pd.getName());
            }
        }
        String[] result = new String[emptyNames.size()];
        return emptyNames.toArray(result);
    }

    //Use Spring BeanUtils to copy and ignore null
    public static void copyNewFieldValuesIntoOldObject(Object src, Object target) {
        BeanUtils.copyProperties(src, target, getNullPropertyNames(src));
    }

    public static int countOfNonNullFields(Object source) {
        int count = 0;
        final BeanWrapper src = new BeanWrapperImpl(source);
        java.beans.PropertyDescriptor[] pds = src.getPropertyDescriptors();

        for (java.beans.PropertyDescriptor pd : pds) {
            Object srcValue = src.getPropertyValue(pd.getName());
            if (srcValue != null) {
                count++;
            }
        }

        return count++;
    }

    public static void copyNestedNonNullProperties(Object source, Object target) {
        if (source == null || target ==  null) {
            return;
        }

        final BeanWrapper sourceBeanWrapper = PropertyAccessorFactory.forBeanPropertyAccess(source);
        BeanWrapper targetBeanWrapper = PropertyAccessorFactory.forBeanPropertyAccess(target);
        PropertyDescriptor[] propertyDescriptors = sourceBeanWrapper.getPropertyDescriptors();

        for (PropertyDescriptor propertyDescriptor : propertyDescriptors) {
            String name = propertyDescriptor.getName();

            // For properties like `class` that don't have a set method, we can't copy so we just ignore them.
            if (targetBeanWrapper.getPropertyDescriptor(name).getWriteMethod() == null) {
                continue;
            }

            Object sourceValue = sourceBeanWrapper.getPropertyValue(name);

            // If sourceValue is null, don't copy it over to target and just move on to the next property.
            if (sourceValue == null) {
                continue;
            }

            Object targetValue = targetBeanWrapper.getPropertyValue(name);

            if (targetValue != null && isDomainModel(propertyDescriptor.getPropertyType())) {
                // Go deeper *only* if the property belongs to Appsmith's models, and both the source and target values
                // are not null.
                copyNestedNonNullProperties(sourceValue, targetValue);
            } else {
                targetBeanWrapper.setPropertyValue(name, sourceValue);
            }
        }
    }

    public static boolean isDomainModel(Class<?> type) {
        return type.getPackageName().startsWith("com.appsmith.");
    }
}
