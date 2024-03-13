package com.appsmith.external.models;

import com.appsmith.external.models.ce.DefaultResourcesCE;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.experimental.FieldNameConstants;

/**
 * This class will be used for connecting resources across branches for git connected application
 * e.g. Page1 in branch1 will have the same defaultResources.pageId as of Page1 of branch2
 */
@EqualsAndHashCode(callSuper = true)
@Data
@FieldNameConstants
public class DefaultResources extends DefaultResourcesCE {
    public static class Fields extends DefaultResourcesCE.Fields {}
}
