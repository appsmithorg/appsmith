package com.appsmith.server.repositories;

import com.appsmith.server.domains.Application;
import com.appsmith.server.services.AclEntity;
import org.springframework.stereotype.Repository;

@Repository
@AclEntity("applications")
public interface ApplicationRepository extends BaseRepository<Application, String>, CustomApplicationRepository {

}
