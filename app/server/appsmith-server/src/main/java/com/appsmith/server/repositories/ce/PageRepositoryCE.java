package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Page;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomPageRepository;

import java.util.List;

public interface PageRepositoryCE extends BaseRepository<Page, String>, CustomPageRepository {

    List<Page> findByApplicationId(String applicationId);
}
