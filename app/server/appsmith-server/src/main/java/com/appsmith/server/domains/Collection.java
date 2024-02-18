package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;

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
    @Type(JsonBinaryType.class)
    @Column(columnDefinition = "jsonb")
    List<NewAction> actions;
}
