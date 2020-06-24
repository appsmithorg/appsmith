package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import net.minidev.json.annotate.JsonIgnore;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

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

    String jarLocation;

    String iconLocation;

    String documentationLink;

    ResponseType responseType;

    List<PluginParameterType> datasourceParams;

    List<PluginParameterType> actionParams;

    String minAppsmithVersionSupported;

    String maxAppsmithVersionSupported;

    String version;

    String uiComponent;

    // Marking it as JsonIgnore because we don't want other users to be able to set this property. Only admins
    // must be able to mark a plugin for defaultInstall on all organization creations
    @JsonIgnore
    Boolean defaultInstall;

    Boolean allowUserDatasources = true;

}
