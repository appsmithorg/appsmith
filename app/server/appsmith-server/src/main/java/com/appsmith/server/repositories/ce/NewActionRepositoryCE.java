package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.BaseRepository;
import com.appsmith.server.repositories.CustomNewActionRepository;
import org.springframework.data.mongodb.repository.Meta;

import java.util.List;
import java.util.Optional;

public interface NewActionRepositoryCE extends BaseRepository<NewAction, String>, CustomNewActionRepository {

    @Meta(cursorBatchSize = 10000)
    List<NewAction> findByApplicationId(String applicationId);

    @Meta(cursorBatchSize = 10000)
    List<NewAction> findAllByIdIn(Iterable<String> ids);

    Optional<Long> countByDeletedAtNull();
}
