package com.appsmith.external.models;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

@Setter
@Getter
@MappedSuperclass
@FieldNameConstants
public abstract class RefAwareDomain extends GitSyncedDomain {

    @JsonView(Views.Public.class)
    String baseId;

    @JsonView(Views.Internal.class)
    String branchName;

    @JsonView(Views.Internal.class)
    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type")
    RefType refType;

    @JsonView(Views.Internal.class)
    String refName;

    public RefType getRefType() {
        if (refType == null) {
            if (this.getRefName() != null) {
                return RefType.branch;
            } else {
                return null;
            }
        }
        return refType;
    }

    public String getRefName() {
        return refName == null ? branchName : refName;
    }

    public void setRefName(String refName) {
        this.refName = refName;
        if (this.getRefType() == RefType.branch) {
            this.branchName = refName;
        }
    }

    @JsonView(Views.Internal.class)
    public String getBaseIdOrFallback() {
        return baseId == null ? this.getId() : baseId;
    }

    @Override
    public void sanitiseToExportDBObject() {
        this.setBaseId(null);
        this.setBranchName(null);
        super.sanitiseToExportDBObject();
    }

    @Override
    public void makePristine() {
        super.makePristine();
        this.setBaseId(null);
    }

    public static class Fields extends GitSyncedDomain.Fields {}
}
