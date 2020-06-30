package com.appsmith.server.configurations.mongo;

import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.repository.support.ReactiveMongoRepositoryFactoryBean;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.core.support.RepositoryFactorySupport;

import java.io.Serializable;

/**
 * This factory bean class is set in the annotation @EnableReactiveMongoRepositories in {@link com.appsmith.server.configurations.CommonConfig}
 * which overrides the default factory bean {@link ReactiveMongoRepositoryFactoryBean}
 *
 * @param <T>
 * @param <S>
 * @param <ID>
 */
public class SoftDeleteMongoRepositoryFactoryBean<T extends Repository<S, ID>, S, ID extends Serializable>
        extends ReactiveMongoRepositoryFactoryBean<T, S, ID> {

    public SoftDeleteMongoRepositoryFactoryBean(Class<? extends T> repositoryInterface) {
        super(repositoryInterface);
    }

    @Override
    protected RepositoryFactorySupport getFactoryInstance(ReactiveMongoOperations operations) {
        return new SoftDeleteMongoRepositoryFactory(operations);
    }
}
