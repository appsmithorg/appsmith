package com.appsmith.server.repositories.ce;

import com.appsmith.server.domains.CustomJSLib;
import com.appsmith.server.repositories.BaseAppsmithRepositoryImpl;
import com.appsmith.server.repositories.CacheableRepositoryHelper;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Criteria;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static org.springframework.data.mongodb.core.query.Criteria.where;

public class CustomJSLibRepositoryCEImpl extends BaseAppsmithRepositoryImpl<CustomJSLib> implements CustomJSLibRepositoryCE {
    private static final String UID_STRING_IDENTIFIER = "uidString";

    public CustomJSLibRepositoryCEImpl(ReactiveMongoOperations mongoOperations, MongoConverter mongoConverter,
                                       CacheableRepositoryHelper cacheableRepositoryHelper) {
        super(mongoOperations, mongoConverter, cacheableRepositoryHelper);
    }

    /*
        Each custom JS library is supposed to be unique across the branches and applications. This is considered a shared resource and hence
        we don't store separate versions of JS library for each branch or user. And this is the reason why branch name is not used.
        Custom JS library doesn't have any user or application specific data and carries no risk and hence no ACL check is made while fetching the data.
     */
    @Override
    public Mono<CustomJSLib> findByUidString(String uidString) {
        Criteria uidStringMatchCriteria = where(UID_STRING_IDENTIFIER).is(uidString);
        ArrayList<Criteria> listOfCriteria = new ArrayList<>();
        listOfCriteria.add(uidStringMatchCriteria);
        return queryOne(listOfCriteria, List.of());
    }
}