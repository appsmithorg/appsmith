package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Group;
import com.appsmith.server.repositories.AppsmithRepository;

import java.util.List;
import java.util.Optional;

public interface CustomGroupRepositoryCE extends AppsmithRepository<Group> {
    List<Group> getAllByWorkspaceId(String workspaceId);
}
