package com.appsmith.external.models;

import com.appsmith.external.models.ce.DefaultResourcesCE;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * This class will be used for connecting resources across branches for git connected application
 * e.g. Page1 in branch1 will have the same defaultResources.pageId as of Page1 of branch2
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class DefaultResources extends DefaultResourcesCE {}
