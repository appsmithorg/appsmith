package com.appsmith.server.domains;

import com.appsmith.server.domains.ce.ActionCollectionCE;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.FieldNameConstants;
import jakarta.persistence.Entity;

/**
 * This class represents a collection of actions that may or may not belong to the same plugin.
 * The logic for grouping is agnostic of the handling of this collection
 */
@Getter
@Setter
@ToString(callSuper = true)
@NoArgsConstructor
@Entity
@FieldNameConstants
public class ActionCollection extends ActionCollectionCE {
    public static class Fields extends ActionCollectionCE.Fields {}
}
