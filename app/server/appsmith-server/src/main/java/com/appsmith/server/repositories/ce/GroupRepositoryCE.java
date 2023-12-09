package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomGroupRepository;
import java.util.List;
import java.util.Optional;

public interface GroupRepositoryCE extends BaseRepository<Group, String>, CustomGroupRepository {}
