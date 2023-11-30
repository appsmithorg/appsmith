package com.appsmith.server.repositories.ce;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface CustomJSLibRepositoryCE extends AppsmithRepository<CustomJSLib> {
    Optional<CustomJSLib> findUniqueCustomJsLib(CustomJSLib customJSLib);

    List<CustomJSLib> findCustomJsLibsInContext(
            Set<String> uidStrings, String referenceId, CreatorContextType contextType);
}
