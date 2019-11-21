package com.appsmith.server.repositories;

import com.appsmith.server.domains.Group;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupRepository extends BaseRepository<Group, String> {
}
