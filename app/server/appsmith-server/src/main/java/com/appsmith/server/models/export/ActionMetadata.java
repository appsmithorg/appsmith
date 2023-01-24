package com.appsmith.server.models.export;

import java.util.Set;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Data;

@Data
public class ActionMetadata {
    @JsonView(Views.Internal.class)
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
    @JsonView(Views.Internal.class)
    private String body;
    private boolean deleted;
    private String gitSyncId;
}
