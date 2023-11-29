package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.repositories.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationSnapshotRepositoryCE
        extends CustomApplicationSnapshotRepositoryCE, BaseRepository<ApplicationSnapshot, String> {
    List<ApplicationSnapshot> findByApplicationId(String applicationId);

    Optional<Void> deleteAllByApplicationId(String applicationId);
}
