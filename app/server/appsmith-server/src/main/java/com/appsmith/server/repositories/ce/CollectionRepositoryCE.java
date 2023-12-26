package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.Collection;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomCollectionRepository;
import java.util.List;
import java.util.Optional;

public interface CollectionRepositoryCE extends BaseRepository<Collection, String>, CustomCollectionRepository {}
