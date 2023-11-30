package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
public class Collection extends BaseDomain {

    String name;

    String applicationId;

    String workspaceId;

    Boolean shared;

    // To save space, when creating/updating collection, only add Action's id field instead of the entire action.
    @OneToMany
    List<NewAction> actions;
}
