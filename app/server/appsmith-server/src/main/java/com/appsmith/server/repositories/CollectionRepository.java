package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.CollectionRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface CollectionRepository extends CollectionRepositoryCE, CustomCollectionRepository {}
