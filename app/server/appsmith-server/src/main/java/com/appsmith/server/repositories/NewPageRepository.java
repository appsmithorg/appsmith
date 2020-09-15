package com.appsmith.server.repositories;

import com.appsmith.server.domains.NewPage;
import org.springframework.stereotype.Repository;

@Repository
public interface NewPageRepository extends BaseRepository<NewPage, String>, CustomNewPageRepository {
}
