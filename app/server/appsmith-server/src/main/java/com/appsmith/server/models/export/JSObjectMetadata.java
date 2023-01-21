package com.appsmith.server.modals;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

@Data
public class JSObjectMetadata {
    @JsonIgnore
    private String name;
    @JsonIgnore
    private String pageId;
    private String pluginId;
    private List<String> actions;
    private List<String> archivedActions; //TODO check this field
    @JsonIgnore
    private String id;
    @JsonIgnore
    private String body;
    private Boolean deleted;
    private String gitSyncId;
}
