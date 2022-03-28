package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.PageRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface PageRepository extends PageRepositoryCE, CustomPageRepository {

}
