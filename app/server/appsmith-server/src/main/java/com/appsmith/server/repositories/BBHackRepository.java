package com.appsmith.server.repositories;

import com.appsmith.server.domains.BuildingBlockHack;
import org.springframework.stereotype.Repository;

@Repository
public interface BBHackRepository
        extends BaseRepository<BuildingBlockHack, String>, com.appsmith.server.repositories.CustomBBHackRepository {}
