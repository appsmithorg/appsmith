package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.projections.ApplicationSnapshotResponseDTO;
import com.appsmith.server.repositories.BaseRepository;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Optional;

public interface ApplicationSnapshotRepositoryCE
        extends CustomApplicationSnapshotRepositoryCE, BaseRepository<ApplicationSnapshot, String> {
    List<ApplicationSnapshot> findByApplicationId(String applicationId);

    @Transactional
    Optional<Void> deleteAllByApplicationId(String applicationId);

    Optional<ApplicationSnapshotResponseDTO> findByApplicationIdAndChunkOrder(String applicationId, Integer chunkOrder);
}
