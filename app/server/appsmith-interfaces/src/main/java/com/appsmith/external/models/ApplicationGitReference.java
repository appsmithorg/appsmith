package com.appsmith.external.models;

import com.appsmith.external.models.ce.ApplicationGitReferenceCE;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * A DTO class to hold complete information about an application, which will then be serialized to a file so as to
 * export/save that application into a json files.
 */
@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor
public class ApplicationGitReference extends ApplicationGitReferenceCE implements ArtifactGitReference {}
