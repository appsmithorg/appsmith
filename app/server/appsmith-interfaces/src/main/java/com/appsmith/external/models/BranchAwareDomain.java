package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public abstract class BranchAwareDomain extends BaseDomain {
    // This field will be used to store the default/root resource IDs for branched resources generated for git
    // connected applications and will be used to connect resources across the branches
    @JsonView(Views.Internal.class)
    DefaultResources defaultResources;

    @Override
    @Deprecated
    public void sanitiseToExportDBObject() {
        this.setDefaultResources(null);
        super.sanitiseToExportDBObject();
    }
}
