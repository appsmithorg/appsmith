package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.PluginType;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Plugin extends BaseDomain {

    public enum ResponseType {
        TABLE,
        JSON,
    }

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    PluginType type;

    @JsonView(Views.Api.class)
    String packageName;

    @JsonView(Views.Api.class)
    String pluginName;

    @JsonView(Views.Api.class)
    String jarLocation;

    @JsonView(Views.Api.class)
    String iconLocation;

    @JsonView(Views.Api.class)
    String documentationLink;

    @JsonView(Views.Api.class)
    ResponseType responseType;

    @JsonView(Views.Api.class)
    List<PluginParameterType> datasourceParams;

    @JsonView(Views.Api.class)
    List<PluginParameterType> actionParams;

    @JsonView(Views.Api.class)
    String minAppsmithVersionSupported;

    @JsonView(Views.Api.class)
    String maxAppsmithVersionSupported;

    @JsonView(Views.Api.class)
    String version;

    // Legacy field to find which form to use (RapidAPI hack)
    @JsonView(Views.Api.class)
    String uiComponent;

    // Static metadata to indicate what type of form to use in the datasource creation page
    @JsonView(Views.Api.class)
    String datasourceComponent;

    // Static metadata to indicate what type of form to use in the action creation page
    @JsonView(Views.Api.class)
    String actionComponent;

    // Static metadata to indicate if the plugin is suitable for generating CRUD page from DB table if yes then page
    // name will be specified by this field which will be referenced from template application
    // CRUD-DB-Table-Template-Application.json
    @JsonView(Views.Api.class)
    String generateCRUDPageComponent;

    // Marking it as JsonIgnore because we don't want other users to be able to set this property. Only admins
    // must be able to mark a plugin for defaultInstall on all workspace creations
    @JsonView(Views.Internal.class)
    Boolean defaultInstall;

    @JsonView(Views.Api.class)
    Boolean allowUserDatasources = true;

    @JsonView(Views.Api.class)
    boolean isRemotePlugin = false;

    // Stores the equivalent of editor.json for remote plugins
    @JsonView(Views.Api.class)
    Map actionUiConfig;

    // Stores the equivalent of form.json for remote plugins
    @JsonView(Views.Api.class)
    Map datasourceUiConfig;

    @Transient
    @JsonView(Views.Api.class)
    Map<String, String> templates;

}
