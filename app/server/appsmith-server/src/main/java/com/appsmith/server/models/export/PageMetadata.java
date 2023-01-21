package com.appsmith.server.modals;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

public class PageMetadata {
    String name;
    String slug;
    List<LayoutMetadata> layouts;
    @JsonIgnore
    List<ActionMetadata> actions;
    @JsonIgnore
    List<JSObjectMetadata> jsObjects;
    String gitSyncId;
    Boolean deleted;
}
