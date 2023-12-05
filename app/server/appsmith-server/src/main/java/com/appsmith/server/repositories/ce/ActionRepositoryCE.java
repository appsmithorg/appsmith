package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Action;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomActionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActionRepositoryCE extends BaseRepository<Action, String>, CustomActionRepository {

    List<Action> findByPageId(String pageId);

    List<Action> findByWorkspaceId(String workspaceId);
}
