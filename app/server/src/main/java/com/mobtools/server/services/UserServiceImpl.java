package com.mobtools.server.services;

import com.mobtools.server.domains.User;
import com.mobtools.server.repositories.UserRepository;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

@Service
public class UserServiceImpl extends BaseService<UserRepository, User, String> implements UserService, UserDetailsService {

    private UserRepository repository;

    public UserServiceImpl(Scheduler scheduler,
                           MongoConverter mongoConverter,
                           ReactiveMongoTemplate reactiveMongoTemplate,
                           UserRepository repository) {
        super(scheduler, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
    }

    @Override
    public Mono<User> findByUsername(String name) {
        return repository.findByName(name);
    }

    @Override
    public Mono<User> findByEmail(String email) {
        return repository.findByEmail(email);
    }

    @Override
    public Mono<User> save(User user) {
        return repository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return repository.findByName(username).block();
    }
}
