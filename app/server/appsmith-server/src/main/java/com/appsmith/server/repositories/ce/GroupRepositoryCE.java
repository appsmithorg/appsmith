/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomGroupRepository;

public interface GroupRepositoryCE extends BaseRepository<Group, String>, CustomGroupRepository {}
