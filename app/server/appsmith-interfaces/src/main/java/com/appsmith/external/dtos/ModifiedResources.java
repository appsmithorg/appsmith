package com.appsmith.external.dtos;

import lombok.Data;
import org.apache.commons.lang3.StringUtils;
import org.springframework.util.CollectionUtils;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * This DTO class is used to store which resources have been updated after the last commit.
 * Primarily the export process sets this information and git import process uses this information to identify
 * which resources need to be written in file system. For example, if a page has not been updated after the last commit,
 * the name of the page should not be part of the modifiedResourceMap so that git will skip this page when it writes
 * the pages to file system for difference git processes e.g. check git status, commit etc
 */
@Data
public class ModifiedResources {
    // boolean flag to set whether all the resources should be considered as updated or not, it'll be false by default
    private boolean isAllModified;

    // a map to store the type of the resources and related entries
    Map<String, Set<String>> modifiedResourceMap = new ConcurrentHashMap<>();

    /**
     * Checks whether the provided resource name should be considered as modified or not.
     * It'll return true if the isAllModified flag is set or the resource is present in the modifiedResourceMap
     * @param resourceType String, type of the resource e.g. PAGE_LIST
     * @param resourceName String, name of the resource e.g. "Home Page"
     * @return true if modified, false otherwise
     */
    public boolean isResourceUpdated(String resourceType, String resourceName) {
        return StringUtils.isNotEmpty(resourceType)
                && (isAllModified
                        || (!CollectionUtils.isEmpty(modifiedResourceMap.get(resourceType))
                                && modifiedResourceMap.get(resourceType).contains(resourceName)));
    }

    /**
     * Adds a new resource to the map. Will create a new set if no set found for the provided resource type.
     * @param resourceType String, type of the resource e.g. PAGE_LST
     * @param resourceName String, name of the resource e.g. Home Page
     */
    public void putResource(String resourceType, String resourceName) {
        if (!this.modifiedResourceMap.containsKey(resourceType)) {
            this.modifiedResourceMap.put(resourceType, new HashSet<>());
        }
        this.modifiedResourceMap.get(resourceType).add(resourceName);
    }

    /**
     * Adds a set of resources to the map. Will create a new set if no set found for the provided resource type.
     * It'll append the resources to the set.
     * @param resourceType String, type of the resource e.g. PAGE_LST
     * @param resourceNames Set of String, names of the resource e.g. Home Page, About page
     */
    public void putResource(String resourceType, Set<String> resourceNames) {
        if (!this.modifiedResourceMap.containsKey(resourceType)) {
            this.modifiedResourceMap.put(resourceType, new HashSet<>());
        }
        this.modifiedResourceMap.get(resourceType).addAll(resourceNames);
    }
}
