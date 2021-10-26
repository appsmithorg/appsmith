package com.appsmith.external.models;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * A DTO class to hold complete information about an application, which will then be serialized to a file so as to
 * export/save that application into a json files.
 */
@Data
@NoArgsConstructor
public class ApplicationGitReference {

    Object application;
    Object metadata;
    Map<String, Object> actions;
    Map<String, Object> actionsCollections;
    Map<String, Object> pages;
    Map<String, Object> datasources;

}
