package com.appsmith.server.services;

import com.appsmith.server.domains.User;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.BeanCopyUtils;
import com.appsmith.server.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import javax.validation.Validator;

@Slf4j
@Service
public class UserServiceImpl extends BaseService<UserRepository, User, String> implements UserService, UserDetailsService {

    private UserRepository repository;
    private final OrganizationService organizationService;

    @Autowired
    public UserServiceImpl(Scheduler scheduler,
                           Validator validator,
                           MongoConverter mongoConverter,
                           ReactiveMongoTemplate reactiveMongoTemplate,
                           UserRepository repository, OrganizationService organizationService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository);
        this.repository = repository;
        this.organizationService = organizationService;
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

    @Override
    public Mono<User> getCurrentUser() {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(Authentication::getPrincipal)
                .flatMap(principal -> {
                    String email;
                    if (principal instanceof org.springframework.security.core.userdetails.User) {
                        org.springframework.security.core.userdetails.User user = (org.springframework.security.core.userdetails.User) principal;
                        //Assumption that the user has inputted an email as username during user creation and not english passport name
                        email = user.getUsername();
                    } else {
                        DefaultOidcUser defaultOidcUser = (DefaultOidcUser) principal;
                        email = defaultOidcUser.getEmail();
                    }
                    return repository.findByEmail(email);
                });
    }

    @Override
    public Mono<User> update(String id, User userUpdate) {
        Mono<User> userFromRepository = repository.findById(id);

        return Mono.just(userUpdate)
                .flatMap(this::validateUpdate)
                //Once the new update has been validated, update the user with the new fields.
                .then(userFromRepository)
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, id)))
                .map(existingUser -> {
                    BeanCopyUtils.copyNewFieldValuesIntoOldObject(userUpdate, existingUser);
                    return existingUser;
                })
                .flatMap(repository::save);
    }

    //Validation for user update. Right now it only validates the organization id. Other checks can be added
    //here in the future.
    private Mono<User> validateUpdate(User updateUser) {
        if (updateUser.getOrganizationId() == null) {
            //No organization present implies the update to the user is not to the organization id. No checks currently
            //for this scenario. Return the user successfully.
            return Mono.just(updateUser);
        }
        return organizationService.findById(updateUser.getOrganizationId())
                //If the organization is not found in the repository, throw an error
                .switchIfEmpty(Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, updateUser.getOrganizationId())))
                .then(Mono.just(updateUser));

    }

}
