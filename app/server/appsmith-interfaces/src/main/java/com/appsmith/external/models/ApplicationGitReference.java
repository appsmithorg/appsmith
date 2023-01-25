package com.appsmith.external.models;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonView;

/**
 * A DTO class to hold complete information about an application, which will then be serialized to a file so as to
 * export/save that application into a json files.
 */
@Data
@NoArgsConstructor
public class ApplicationGitReference {

    @JsonView(Views.Api.class)
    Object application;

    @JsonView(Views.Api.class)
    Object metadata;

    @JsonView(Views.Api.class)
    Object theme;

    @JsonView(Views.Api.class)
    Map<String, Object> actions;

    @JsonView(Views.Api.class)
    Map<String, Object> actionCollections;

    @JsonView(Views.Api.class)
    Map<String, String> actionCollectionBody;

    @JsonView(Views.Api.class)
    Map<String, Object> pages;

    @JsonView(Views.Api.class)
    Map<String, Object> datasources;

    @JsonView(Views.Api.class)
    Map<String, Object> jsLibraries;

    /**
     * This field will be used to store map of files to be updated in local file system by comparing the recent
     * changes in database and the last local git commit.
     * This field can be used while saving resources to local file system and only update the resource files which
     * are updated in the database.
     */
    @JsonView(Views.Api.class)
    Map<String, Set<String>> updatedResources;
}
