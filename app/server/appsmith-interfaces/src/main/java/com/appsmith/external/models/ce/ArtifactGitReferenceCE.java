package com.appsmith.external.models.ce;

import com.appsmith.external.dtos.ModifiedResources;

import java.util.Map;

public interface ArtifactGitReferenceCE {

    void setDatasources(Map<String, Object> datasourceList);

    void setModifiedResources(ModifiedResources modifiedResources);
}
