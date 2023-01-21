package com.appsmith.server.models.export;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

@Data
public class ActionMetadata {
    @JsonIgnore
    private String name;
    private String pluginId;
    private String fullyQualifiedName;
    private String datasourceName;
    private String datasourcePluginId;
    private String pageId;
    private String collectionId;
    private ActionConfigurationMetadata actionConfiguration;
    private Boolean executeOnLoad;
    private Boolean clientSideExecution;
    private Set<String> jsonPathKeys;
    private Boolean userSetOnLoad = false; //TODO check this field
    private Boolean confirmBeforeExecute = false;
    @JsonIgnore
    private String body;
    private boolean deleted;
    private String gitSyncId;
}
