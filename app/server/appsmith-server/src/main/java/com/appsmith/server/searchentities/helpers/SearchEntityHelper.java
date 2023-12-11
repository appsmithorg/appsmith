package com.appsmith.server.searchentities.helpers;

public class SearchEntityHelper {
    /**
     * This method checks if the entity should be searched based on the entities list provided. If the entities list is null or empty, then all entities are searched.
     *
     * @param entity    The entity to search for.
     * @param entities  The list of entities to search for. If null or empty, all entities are searched.
     * @return          True if the entity should be searched, false otherwise.
     */
    public static boolean shouldSearchEntity(Class<?> entity, String[] entities) {
        if (entities == null || entities.length == 0) {
            return true;
        }
        for (String entityToSearch : entities) {
            if (entityToSearch.equalsIgnoreCase(entity.getSimpleName())) {
                return true;
            }
        }
        return false;
    }
}
