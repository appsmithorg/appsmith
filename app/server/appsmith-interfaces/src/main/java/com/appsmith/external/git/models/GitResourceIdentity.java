package com.appsmith.external.git.models;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

@Data
@RequiredArgsConstructor
public class GitResourceIdentity {

    // TODO  @Nidhi should we persist this sha against the Appsmith domain to integrate with the isModified logic?
    String sha;

    @NonNull @EqualsAndHashCode.Include
    GitResourceType resourceType;

    // This is gitSyncId for most resources, where available
    // It could otherwise point to whatever defines uniqueness for that resource
    // Exceptions: widgets, jsLibs, json files in root dir
    // widgets -> pageGitSyncId-widgetId
    // jsLibs ->  jsLibFileName
    // root dir files -> fileName
    @NonNull @EqualsAndHashCode.Include
    String resourceIdentifier;

    @NonNull String filePath;
}
