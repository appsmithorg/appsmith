package com.appsmith.external.models;

import lombok.Data;

import java.util.Map;

/**
 * A DTO class to hold complete information about an application, which will then be serialized to a file so as to
 * export/save that application into a json files.
 */
@Data
public class ApplicationGitReference {

    Object application;
    Map<String, Object> actions;
    Map<String, Object> pages;
    Map<String, Object> datasources;

}
