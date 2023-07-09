package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.springframework.util.CollectionUtils;

import java.util.Set;

import static com.appsmith.external.helpers.AppsmithBeanUtils.copyNestedNonNullProperties;

@Data
@NoArgsConstructor
public class DatasourceStorageDTO implements Forkable<DatasourceStorageDTO> {

    String id;
    String datasourceId;
    String environmentId;
    DatasourceConfiguration datasourceConfiguration;
    Boolean isConfigured;
    Set<String> invalids;
    Set<String> messages;

    String pluginId;
    String workspaceId;

    public DatasourceStorageDTO(DatasourceStorage datasourceStorage) {
        this.id = datasourceStorage.getId();
        this.datasourceId = datasourceStorage.getDatasourceId();
        this.environmentId = datasourceStorage.getEnvironmentId();
        this.datasourceConfiguration = datasourceStorage.getDatasourceConfiguration();
        this.isConfigured = datasourceStorage.getIsConfigured();
        this.invalids = datasourceStorage.getInvalids();
        this.messages = datasourceStorage.getMessages();
    }

    public DatasourceStorageDTO(DatasourceDTO datasource, String environmentId) {
        this.datasourceId = datasource.getId();
        this.environmentId = environmentId;
        this.datasourceConfiguration = datasource.getDatasourceConfiguration();
        this.isConfigured = datasource.getIsConfigured();
        this.invalids = datasource.getInvalids();
        this.messages = datasource.getMessages();
    }

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

    @Override
    public DatasourceStorageDTO fork(Boolean forkWithConfiguration, String toWorkspaceId) {
        AuthenticationDTO initialAuth = null;
        DatasourceStorageDTO newDatasourceStorageDTO = new DatasourceStorageDTO();
        copyNestedNonNullProperties(this, newDatasourceStorageDTO);
        newDatasourceStorageDTO.setId(null);
        newDatasourceStorageDTO.setDatasourceId(null);

        if (newDatasourceStorageDTO.getDatasourceConfiguration() != null) {
            initialAuth = newDatasourceStorageDTO.getDatasourceConfiguration().getAuthentication();
        }

        if (!Boolean.TRUE.equals(forkWithConfiguration)) {
            newDatasourceStorageDTO.setDatasourceConfiguration(null);
        }

        /*
        updating the datasource "isConfigured" field, which will be used to return if the forking is a partialImport or not
        post forking any application, datasource reconnection modal will appear based on isConfigured property
        Ref: getApplicationImportDTO()
        */

        boolean isConfigured = forkWithConfiguration
                && (newDatasourceStorageDTO.getDatasourceConfiguration() != null
                        && newDatasourceStorageDTO.getDatasourceConfiguration().getAuthentication() != null);

        if (initialAuth instanceof OAuth2) {
            /*
            This is the case for OAuth2 datasources, for example Google sheets, we don't want to copy the token to the
            new workspace as it is user's personal token. Hence, in case of forking to a new workspace the datasource
            needs to be re-authorised.
            */
            newDatasourceStorageDTO.setIsConfigured(false);
            if (isConfigured) {
                newDatasourceStorageDTO
                        .getDatasourceConfiguration()
                        .getAuthentication()
                        .setAuthenticationResponse(null);
            }
        } else {
            newDatasourceStorageDTO.setIsConfigured(isConfigured);
        }

        return newDatasourceStorageDTO;
    }
}
