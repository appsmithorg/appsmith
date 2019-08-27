package com.mobtools.server.repositories;

import com.mobtools.server.domains.Resource;
import org.springframework.stereotype.Repository;

@Repository
public interface ResourceRepository extends BaseRepository<Resource, String>{
}
