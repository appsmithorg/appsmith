package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewAction;
import org.springframework.stereotype.Repository;

@Repository
public interface NewActionRepository extends BaseRepository<NewAction, String>, CustomNewActionRepository {
}
