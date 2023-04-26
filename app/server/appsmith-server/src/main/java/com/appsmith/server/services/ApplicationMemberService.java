package com.appsmith.server.services;

import com.appsmith.server.dtos.MemberInfoDTO;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

public interface ApplicationMemberService {
    Mono<List<MemberInfoDTO>> getAllMembersForApplication(String applicationId);

    Flux<MemberInfoDTO> getAllApplicationsMembersForWorkspace(String workspaceId);
}
