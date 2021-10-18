package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.annotate.JsonIgnore;
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

    String name;

    PluginType type;

    String packageName;

    String pluginName;

    String jarLocation;

    String iconLocation;

    String documentationLink;

    ResponseType responseType;

    List<PluginParameterType> datasourceParams;

    List<PluginParameterType> actionParams;

    String minAppsmithVersionSupported;

    String maxAppsmithVersionSupported;

    String version;

    // Legacy field to find which form to use (RapidAPI hack)
    String uiComponent;

    // Static metadata to indicate what type of form to use in the datasource creation page
    String datasourceComponent;

    // Static metadata to indicate what type of form to use in the action creation page
    String actionComponent;

    // Static metadata to indicate if the plugin is suitable for generating CRUD page from DB table if yes then page
    // name will be specified by this field which will be referenced from template application
    // CRUD-DB-Table-Template-Application.json
    String generateCRUDPageComponent;

    // Marking it as JsonIgnore because we don't want other users to be able to set this property. Only admins
    // must be able to mark a plugin for defaultInstall on all organization creations
    @JsonIgnore
    Boolean defaultInstall;

    Boolean allowUserDatasources = true;

    boolean isRemotePlugin = false;

    // Stores the equivalent of editor.json for remote plugins
    Map actionUiConfig;

    // Stores the equivalent of form.json for remote plugins
    Map datasourceUiConfig;

    @Transient
    Map<String, String> templates;

}
