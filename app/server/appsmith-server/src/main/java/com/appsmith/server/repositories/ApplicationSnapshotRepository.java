package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.ApplicationSnapshotRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationSnapshotRepository extends ApplicationSnapshotRepositoryCE, CustomApplicationSnapshotRepository {

}
