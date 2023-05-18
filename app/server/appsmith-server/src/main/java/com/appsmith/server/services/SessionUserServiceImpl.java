package com.appsmith.server.services;

import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.ce.SessionUserServiceCEImpl;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ReactiveRedisOperations;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

import static com.appsmith.server.constants.FieldName.CREATION_TIME;

@Slf4j
@Service
public class SessionUserServiceImpl extends SessionUserServiceCEImpl implements SessionUserService {

    private final ReactiveRedisOperations<String, Object> redisOperations;
    public SessionUserServiceImpl(UserRepository userRepository,
                                  ReactiveRedisOperations<String, Object> redisOperations) {

        super(userRepository, redisOperations);
        this.redisOperations = redisOperations;
    }

    @Override
    public Mono<Void> logoutExistingSessions(String email, WebFilterExchange exchange) {
        Mono<Long> creationTimeMono = exchange.getExchange().getSession()
            .map(webSession -> webSession.getCreationTime().toEpochMilli());

        return creationTimeMono
            .flatMap(creationTime -> getKeysForExistingSessionsAndFilterByCreationTime(email, creationTime))
            .flatMap(super::deleteSessionsByKeys)
            .then();
    }

    private Mono<List<String>> getKeysForExistingSessionsAndFilterByCreationTime(String email, Long createdAt) {
        return super.getSessionKeysByUserEmail(email)
            .flatMapMany(keys -> {
                return Flux.fromIterable(keys)
                    .flatMap(key -> redisOperations.opsForHash().entries(key)
                        .filter(e -> CREATION_TIME.equals(e.getKey()) && e.getValue() != null && !e.getValue().equals(createdAt))
                        .next()
                        .map(ignore -> key));
            })
            .collectList();
    }
}
