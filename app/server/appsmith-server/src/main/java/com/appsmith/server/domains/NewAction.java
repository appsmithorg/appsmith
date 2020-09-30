package com.appsmith.server.domains;

import com.appsmith.server.dtos.ActionDTO;

public class NewAction {

    // Fields in action that are not allowed to change between published and unpublished versions
    String applicationId;

    String organizationId;

    PluginType pluginType;

    String pluginId;

    // Action specific fields that are allowed to change between published and unpublished versions
    ActionDTO unpublishedAction;

    ActionDTO publishedAction;

}
