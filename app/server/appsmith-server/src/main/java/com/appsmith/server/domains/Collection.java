package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Collection extends BaseDomain {

    @JsonView(Views.Api.class)
    String name;

    @JsonView(Views.Api.class)
    String applicationId;

    //Organizations migrated to workspaces, kept the field as depricated to support the old migration
    @Deprecated
    @JsonView(Views.Api.class)
    String organizationId;

    @JsonView(Views.Api.class)
    String workspaceId;

    @JsonView(Views.Api.class)
    Boolean shared;

    //To save space, when creating/updating collection, only add Action's id field instead of the entire action.
    @JsonView(Views.Api.class)
    List<NewAction> actions;
}
