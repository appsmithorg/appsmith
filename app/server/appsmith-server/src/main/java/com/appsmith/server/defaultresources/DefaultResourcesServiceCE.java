package com.appsmith.server.defaultresources;

public interface DefaultResourcesServiceCE<T> {

    T initialize(T domainObject, String branchName, boolean resetExistingValues);

    T setFromOtherBranch(T domainObject, T defaultDomainObject, String branchName);
}
