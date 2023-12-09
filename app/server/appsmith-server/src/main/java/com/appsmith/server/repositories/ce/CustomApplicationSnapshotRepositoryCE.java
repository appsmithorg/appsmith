package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.Optional;
import java.util.List;

public interface CustomApplicationSnapshotRepositoryCE extends AppsmithRepository<ApplicationSnapshot> {
    Optional<ApplicationSnapshot> findWithoutData(String applicationId);
}
