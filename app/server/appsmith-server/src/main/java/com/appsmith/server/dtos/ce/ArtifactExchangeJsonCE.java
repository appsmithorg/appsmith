package com.appsmith.server.dtos.ce;

import com.appsmith.external.dtos.ModifiedResources;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DecryptedSensitiveFields;
import com.appsmith.external.views.Views;
import com.appsmith.server.constants.ArtifactType;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Artifact;
import com.appsmith.server.domains.Context;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Theme;
import com.fasterxml.jackson.annotation.JsonView;

import java.util.List;
import java.util.Map;

public interface ArtifactExchangeJsonCE {

    Integer getClientSchemaVersion();

    void setClientSchemaVersion(Integer clientSchemaVersion);

    Integer getServerSchemaVersion();

    void setServerSchemaVersion(Integer serverSchemaVersion);

    ArtifactType getArtifactJsonType();

    Artifact getArtifact();

    default void setThemes(Theme unpublishedTheme, Theme publishedTheme) {}

    default List<CustomJSLib> getCustomJSLibList() {
        return null;
    }

    default void setCustomJSLibList(List<CustomJSLib> customJSLibs) {}

    List<DatasourceStorage> getDatasourceList();

    void setDatasourceList(List<DatasourceStorage> datasourceStorages);

    List<NewAction> getActionList();

    void setActionList(List<NewAction> newActions);

    List<ActionCollection> getActionCollectionList();

    void setActionCollectionList(List<ActionCollection> actionCollections);

    Map<String, DecryptedSensitiveFields> getDecryptedFields();

    void setDecryptedFields(Map<String, DecryptedSensitiveFields> decryptedFields);

    ModifiedResources getModifiedResources();

    void setModifiedResources(ModifiedResources modifiedResources);

    default Theme getUnpublishedTheme() {
        return null;
    }

    default Theme getPublishedTheme() {
        return null;
    }

    @JsonView(Views.Internal.class)
    List<? extends Context> getContextList();
}
