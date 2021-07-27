package com.appsmith.server.repositories;

import com.appsmith.server.domains.GitData;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface GitDataRepository extends BaseRepository<GitData, String>, CustomGitRepository {
    Mono<GitData> findByBranchName(String branchName);
}
