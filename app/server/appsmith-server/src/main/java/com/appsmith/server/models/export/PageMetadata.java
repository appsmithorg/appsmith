package com.appsmith.server.models.export;

import java.util.List;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

public class PageMetadata {
    String name;
    String slug;
    List<LayoutMetadata> layouts;
    @JsonView(Views.Internal.class)
    List<ActionMetadata> actions;
    @JsonView(Views.Internal.class)
    List<JSObjectMetadata> jsObjects;
    String gitSyncId;
    Boolean deleted;
}
