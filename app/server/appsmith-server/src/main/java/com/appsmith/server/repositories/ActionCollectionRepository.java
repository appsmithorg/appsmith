/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.repositories;

import com.appsmith.server.repositories.ce.ActionCollectionRepositoryCE;
import org.springframework.stereotype.Repository;

@Repository
public interface ActionCollectionRepository
	extends CustomActionCollectionRepository, ActionCollectionRepositoryCE {}
