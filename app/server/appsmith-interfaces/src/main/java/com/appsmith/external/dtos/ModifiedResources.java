package com.appsmith.external.dtos;

import com.appsmith.external.dtos.ce.ModifiedResourcesCE;
import lombok.Data;

/**
 * This DTO class is used to store which resources have been updated after the last commit.
 * Primarily the export process sets this information and git import process uses this information to identify
 * which resources need to be written in file system. For example, if a page has not been updated after the last commit,
 * the name of the page should not be part of the modifiedResourceMap so that git will skip this page when it writes
 * the pages to file system for difference git processes e.g. check git status, commit etc
 */
@Data
public class ModifiedResources extends ModifiedResourcesCE {}
