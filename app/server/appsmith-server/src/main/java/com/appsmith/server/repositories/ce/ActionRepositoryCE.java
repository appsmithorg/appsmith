package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Action;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomActionRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface ActionRepositoryCE extends BaseRepository<Action, String>, CustomActionRepository {

    List<Action> findDistinctActionsByNameInAndPageIdAndActionConfiguration_HttpMethodAndUserSetOnLoad(
            Set<String> names, String pageId, String httpMethod, Boolean userSetOnLoad);

    List<Action> findDistinctActionsByNameInAndPageIdAndExecuteOnLoadTrue(Set<String> names, String pageId);

    Optional<Long> countByDatasourceId(String datasourceId);

    List<Action> findByPageId(String pageId);

    List<Action> findByWorkspaceId(String workspaceId);
}
