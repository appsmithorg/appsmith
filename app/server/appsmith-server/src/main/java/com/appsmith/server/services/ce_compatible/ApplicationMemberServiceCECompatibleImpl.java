package com.appsmith.server.services.ce_compatible;

import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class ApplicationMemberServiceCECompatibleImpl implements ApplicationMemberServiceCECompatible {
    @Override
    public Mono<List<MemberInfoDTO>> getAllMembersForApplication(String applicationId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Flux<MemberInfoDTO> getAllApplicationsMembersForWorkspace(String workspaceId) {
        return Flux.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }
}
