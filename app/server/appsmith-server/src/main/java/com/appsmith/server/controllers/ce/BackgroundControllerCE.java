package com.appsmith.server.controllers.ce;

import com.appsmith.server.constants.CommentOnboardingState;
import com.appsmith.server.constants.Url;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserData;
import com.appsmith.server.dtos.*;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.UserWorkspaceService;
import com.appsmith.server.solutions.UserSignup;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.Part;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.validation.Valid;
import java.util.List;
import java.util.Map;


@RequestMapping(Url.BACKGROUND_URL)
@Slf4j
public class BackgroundControllerCE{
	@Autowired
	private SessionUserService sessionUserService;

	@GetMapping("/test")
    public Mono<ResponseDTO<User>> getUserProfile() {
        return sessionUserService.getCurrentUser()
                .map(item -> new ResponseDTO<>(HttpStatus.OK.value(), item, null));
    }
}
