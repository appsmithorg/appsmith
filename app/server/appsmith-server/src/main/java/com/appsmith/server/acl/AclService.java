package com.appsmith.server.acl;

import com.appsmith.server.configurations.AclConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.GroupService;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
public class AclService {

    private final String url;

    private final String pkgName;

    private final SessionUserService sessionUserService;
    private final GroupService groupService;

    @Autowired
    public AclService(
            AclConfig aclConfig,
            SessionUserService sessionUserService,
            GroupService groupService) {
        this.url = aclConfig.getHost();
        this.pkgName = aclConfig.getPkgName();
        this.sessionUserService = sessionUserService;
        this.groupService = groupService;
    }

    public Mono<OpaResponse> evaluateAcl(HttpMethod httpMethod, String resource, String requestUrl) {
        JSONObject requestBody = new JSONObject();
        JSONObject input = new JSONObject();
        JSONObject jsonUser = new JSONObject();
        input.put("user", jsonUser);
        input.put("method", httpMethod.name());
        input.put("resource", resource);
        input.put("url", requestUrl); // The url is required for OPA to gate keep only public URLs for anonymous users

        requestBody.put("input", input);

        Mono<User> user = sessionUserService.getCurrentUser();

        return user
                // This is when the user doesn't have an existing session. The user is anonymous
                .switchIfEmpty(Mono.defer(() -> {
                    User anonymous = new User();
                    return Mono.just(anonymous);
                }))
                .flatMap(u -> {
                    Set<String> globalPermissions = new HashSet<>();
                    Set<String> groupSet = u.getGroupIds();
                    globalPermissions.addAll(u.getPermissions());
                    return groupService.getAllById(groupSet)
                            .map(group -> group.getPermissions())
                            .map(permissions -> globalPermissions.addAll(permissions))
                            .collectList()
                            .thenReturn(globalPermissions);
                })
                .flatMap(permissions -> {
                    jsonUser.put("permissions", permissions);
                    String finalUrl = url + pkgName;

                    log.debug("Going to make a data call to OPA: {} with data {}", url, requestBody);

                    WebClient webClient = WebClient.builder()
                            .baseUrl(finalUrl)
                            .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                            .build();

                    WebClient.RequestHeadersSpec<?> request = webClient.post().syncBody(requestBody.toString());
                    return request.retrieve().bodyToMono(OpaResponse.class);
                });
    }
}
