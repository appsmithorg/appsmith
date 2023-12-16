package com.appsmith.external.models;

import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Type;

@Setter
@Getter
@MappedSuperclass
public abstract class BranchAwareDomain extends BaseDomain {
    // This field will be used to store the default/root resource IDs for branched resources generated for git
    // connected applications and will be used to connect resources across the branches
    @JsonView(Views.Internal.class)
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    DefaultResources defaultResources;

    @Override
    public void sanitiseToExportDBObject() {
        this.setDefaultResources(null);
        super.sanitiseToExportDBObject();
    }
}
