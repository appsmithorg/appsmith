package com.appsmith.server.repositories;

import com.appsmith.external.models.BaseDomain;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.NoRepositoryBean;

import java.io.Serializable;

@NoRepositoryBean
public interface BaseRepository<T extends BaseDomain, ID extends Serializable> extends CrudRepository<T, ID> {}
