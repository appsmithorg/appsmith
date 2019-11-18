package com.appsmith.server.domains;

import com.appsmith.external.models.DatasourceConfiguration;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Datasource extends BaseDomain {
    @Indexed(unique = true)
    String name;

    String pluginId;

    String organizationId;

    DatasourceConfiguration datasourceConfiguration;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Boolean isValid;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    Set<String> invalids;
}
