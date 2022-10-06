package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Document
public class EnvironmentVariable extends BaseDomain {


    String environmentId;

    String applicationId;

    String workspaceId;

    String name;

    //subject to type change;
    @JsonProperty
    String value;




    public void sanitiseToExportDBObject() {

        this.setId(null);
        this.setEnvironmentId(null);
        this.setApplicationId(null);
        this.setWorkspaceId(null);
        this.setName(null);

        //subject to change;
        this.setValue(null);
        this.sanitiseToExportBaseObject();

    }
}
