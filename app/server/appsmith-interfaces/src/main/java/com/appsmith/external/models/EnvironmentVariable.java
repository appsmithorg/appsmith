package com.appsmith.external.models;

import com.appsmith.external.annotations.encryption.Encrypted;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Set;


@Getter
@Setter
@NoArgsConstructor
@Document
@ToString
public class EnvironmentVariable extends BaseDomain {


    String environmentId;
    /**
     * Each variable has a datasource associated to it, meaning that in the environment v1.
     * environmentVariables would be used to plug values in datasource configurations.
     */
    String datasourceId;
    String applicationId;
    String workspaceId;
    String name;
    @Encrypted
    String value;

    @Override
    @JsonIgnore(value = true)
    public Set<String> getUserPermissions() {
        return super.getUserPermissions();
    }

}
