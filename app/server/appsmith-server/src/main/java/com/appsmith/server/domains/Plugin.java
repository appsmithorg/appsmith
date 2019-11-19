package com.appsmith.server.domains;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Plugin extends BaseDomain {

    String name;

    PluginType type;

    @Indexed(unique = true)
    String executorClass;

    String jarLocation;

    List<PluginParameterType> datasourceParams;

    List<PluginParameterType> actionParams;

    String minAppsmithVersionSupported;

    String maxAppsmithVersionSupported;

    String version;
}
