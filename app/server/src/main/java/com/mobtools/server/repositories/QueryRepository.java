package com.mobtools.server.repositories;

import com.mobtools.server.domains.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface QueryRepository extends BaseRepository<Query, String> {
}
