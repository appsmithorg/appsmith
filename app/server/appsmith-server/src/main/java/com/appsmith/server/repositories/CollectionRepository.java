package com.appsmith.server.repositories;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.repositories.ce.CollectionRepositoryCE;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

@Repository
public interface CollectionRepository extends CollectionRepositoryCE, CustomCollectionRepository {

}
