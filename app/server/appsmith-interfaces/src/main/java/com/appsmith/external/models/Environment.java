package com.appsmith.external.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document
@NoArgsConstructor
public class Environment extends BaseDomain {

    String workspaceId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    String name;


    public void sanitiseToExportDBObject() {
        this.sanitiseToExportBaseObject();
    }
}
