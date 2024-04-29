package com.appsmith.external.models;

import com.appsmith.external.views.FromRequest;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.springframework.util.CollectionUtils;

import java.util.Set;

@Data
@NoArgsConstructor
public class DatasourceStorageDTO {

    String id;
    String datasourceId;

    @JsonView({Views.Public.class, FromRequest.class})
    String environmentId;

    @JsonView({Views.Public.class, FromRequest.class})
    DatasourceConfiguration datasourceConfiguration;

    @JsonView({Views.Public.class, FromRequest.class})
    Boolean isConfigured;

    Set<String> invalids;
    Set<String> messages;

    String pluginId;
    String workspaceId;

    /**
     * This constructor is used when we have datasource config readily available for creation of datasource.
     * or, for updating the datasource storages.
     * @param datasourceId
     * @param environmentId
     * @param datasourceConfiguration
     */
    public DatasourceStorageDTO(
            String datasourceId, String environmentId, DatasourceConfiguration datasourceConfiguration) {
        this.datasourceId = datasourceId;
        this.environmentId = environmentId;
        this.datasourceConfiguration = datasourceConfiguration;
        this.isConfigured = Boolean.TRUE;
    }

    @JsonView(Views.Public.class)
    public boolean getIsValid() {
        return CollectionUtils.isEmpty(invalids);
    }

    /**
     * Intended to function like `.equals`, but only semantically significant fields, except for the ID. Semantically
     * significant just means that if two datasource have same values for these fields, actions against them will behave
     * exactly the same.
     *
     * @return true if equal, false otherwise.
     */
    public boolean softEquals(DatasourceStorageDTO other) {
        if (other == null) {
            return false;
        }

        return new EqualsBuilder()
                .append(datasourceConfiguration, other.datasourceConfiguration)
                .isEquals();
    }
}
