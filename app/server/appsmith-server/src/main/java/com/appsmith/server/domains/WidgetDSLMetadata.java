package com.appsmith.server.domains;

import lombok.Getter;
import lombok.Setter;

import java.util.Set;

/**
 * A DTO class to hold widget dsl information, which will then be serialized to a file so as to create separate
 * directory for widgets while saving the application in git repo.
 */
@Getter
@Setter
public class WidgetDSLMetadata {

    Set<String> childrenIds;

    // Parent widget Id
    String parentId;

    // Id of the current widget
    String id;

    // Current widget DSL
    Object dsl;
}
