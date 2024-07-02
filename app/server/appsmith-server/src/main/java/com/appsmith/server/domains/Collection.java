package com.appsmith.server.domains;

import com.appsmith.external.helpers.CustomJsonType;
import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.Where;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
@Where(clause = "deleted_at IS NULL")
public class Collection extends BaseDomain {

    String name;

    String applicationId;

    String workspaceId;

    Boolean shared;

    // To save space, when creating/updating collection, only add Action's id field instead of the entire action.
    @Type(CustomJsonType.class)
    @Column(columnDefinition = "jsonb")
    List<NewAction> actions;
}
