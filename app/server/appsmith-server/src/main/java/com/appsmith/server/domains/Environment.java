package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@Document
@NoArgsConstructor
public class Environment extends BaseDomain {

    String workspaceId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String name;

    @Transient
    List<EnvironmentVariable> environmentVariableList;


    public void sanitiseToExportDBObject() {
        this.sanitiseToExportBaseObject();
     }
}
