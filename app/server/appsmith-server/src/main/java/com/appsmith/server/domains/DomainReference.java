package com.appsmith.server.domains;

import java.util.Arrays;
import java.util.Optional;
import java.util.Set;

public enum DomainReference {

    APPLICATION(Set.of(Application.class.getSimpleName())),
    WORKSPACE(Set.of(Workspace.class.getSimpleName())),
    BASE_DOMAIN(Set.of())
    ;

    private Set<String> refersTo;

    DomainReference(Set<String> refersTo) {
        this.refersTo = refersTo;
    }

    public static DomainReference domainRefersTo(String domainName) {
        Optional<DomainReference> domainReference = Arrays.stream(DomainReference.values())
                .filter(reference -> reference.refersTo.contains(domainName)).findFirst();
        return domainReference.orElse(BASE_DOMAIN);
    }
}
