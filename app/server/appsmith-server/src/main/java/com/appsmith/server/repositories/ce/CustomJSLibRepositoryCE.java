package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Optional;

public interface CustomJSLibRepositoryCE extends AppsmithRepository<CustomJSLib> {
    Optional<CustomJSLib> findByUidString(String uidString);
}
