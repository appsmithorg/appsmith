package com.appsmith.external.models.ce;

import com.appsmith.external.dtos.ModifiedResources;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * A DTO class to hold complete information about an application, which will then be serialized to a file so as to
 * export/save that application into a json files.
 */
@Data
@NoArgsConstructor
public class ApplicationGitReferenceCE implements ArtifactGitReferenceCE {

    Object application;
    Object metadata;
    Object theme;
    Map<String, Object> actions;
    Map<String, String> actionBody;
    Map<String, Object> actionCollections;
    Map<String, String> actionCollectionBody;
    Map<String, Object> pages;
    Map<String, String> pageDsl;
    Map<String, Object> datasources;
    Map<String, Object> jsLibraries;

    /**
     * This field will be used to store map of files to be updated in local file system by comparing the recent
     * changes in database and the last local git commit.
     * This field can be used while saving resources to local file system and only update the resource files which
     * are updated in the database.
     */
    ModifiedResources modifiedResources;
}
