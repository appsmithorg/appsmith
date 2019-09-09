package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository extends BaseRepository<Application, String> {
}
