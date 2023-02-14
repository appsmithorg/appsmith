package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.ApplicationSnapshot;
import com.appsmith.server.repositories.BaseRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationSnapshotRepositoryCE extends BaseRepository<ApplicationSnapshot, String> {
}
