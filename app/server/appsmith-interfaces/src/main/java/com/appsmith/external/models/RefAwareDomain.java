package com.appsmith.external.models;

import com.appsmith.external.git.constants.ce.RefType;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

@Setter
@Getter
@FieldNameConstants
public abstract class RefAwareDomain extends GitSyncedDomain {

    @JsonView(Views.Public.class)
    String baseId;

    @JsonView(Views.Internal.class)
    String branchName;

    @JsonView(Views.Internal.class)
    RefType refType;

    @JsonView(Views.Internal.class)
    String refName;

    public RefType getRefType() {
        return refType == null ? RefType.BRANCH : refType;
    }

    public String getRefName() {
        return refName == null ? branchName : refName;
    }

    public void setRefName(String refName) {
        this.refName = refName;
        if (refType == null || refType == RefType.BRANCH) {
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
