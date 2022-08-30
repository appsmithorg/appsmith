package com.appsmith.server.helpers;


import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CollectionUtils {

    /**
     * Helper function to check if a collection is null or empty.
     *
     * @param c
     * @return
     */
    public static boolean isNullOrEmpty(final Collection<?> c) {
        return (c == null || c.isEmpty());
    }

    /**
     * Helper function to check if a map is null or empty
     *
     * @param m
     * @return
     */
    public static boolean isNullOrEmpty(final Map<?, ?> m) {
        return (m == null || m.isEmpty());
    }

    /**
     * Puts an item at the beginning of the list. If the item already exists in other position, it'll move it to first
     * @param list
     * @param item
     * @param <E>
     */
    public static <E> void putAtFirst(List<E> list, E item) {
        // check if item already exists
        int index = list.indexOf(item);
        if(index == -1) {  // does not exist so put it at first
            list.add(0, item);
        } else if(index > 0) {
            list.remove(item);
            list.add(0, item);
        }
    }

    /**
     * Removes duplicate items from an array list
     * @param list
     * @param <T>
     * @return
     */
    public static <T> void removeDuplicates(List<T> list)
    {
        // Create a new LinkedHashSet
        Set<T> set = new LinkedHashSet<T>(list);

        // Clear the list
        list.clear();

        // add the elements of set
        // with no duplicates to the list
        list.addAll(set);
    }

}
