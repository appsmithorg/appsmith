package com.appsmith.server.repositories;

import com.appsmith.server.domains.Page;
import org.springframework.stereotype.Repository;

@Repository
public interface PageRepository extends BaseRepository<Page, String>, CustomPageRepository {

}
