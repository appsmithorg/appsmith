package com.appsmith.server.models.export;

import java.util.List;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class JSObjectMetadata {
    @JsonView(Views.Internal.class)
    private String name;
    @JsonView(Views.Internal.class)
    private String pageId;
    private String pluginId;
    private List<String> actions;
    private List<String> archivedActions; //TODO check this field
    @JsonView(Views.Internal.class)
    private String id;
    @JsonView(Views.Internal.class)
    private String body;
    private Boolean deleted;
    private String gitSyncId;
}
