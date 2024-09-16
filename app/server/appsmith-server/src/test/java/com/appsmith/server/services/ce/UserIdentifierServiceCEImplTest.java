package com.appsmith.server.services.ce;

import com.appsmith.server.configurations.CommonConfig;
import com.appsmith.server.domains.User;
import com.appsmith.server.services.UserIdentifierService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
public class UserIdentifierServiceCEImplTest {

    @SpyBean
    CommonConfig commonConfig;

    @Autowired
    UserIdentifierService userIdentifierService;

    @Test
    void getUserIdentifier_whenCloudHosting_returnsEmail() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(true);
        User user = new User();
        user.setEmail("test@gmail.com");
        assertThat(userIdentifierService.getUserIdentifier(user)).isEqualTo("test@gmail.com");
    }

    @Test
    void getUserIdentifier_whenSelfHosted_returnsHashedEmail() {
        Mockito.when(commonConfig.isCloudHosting()).thenReturn(false);
        User user = new User();
        user.setEmail("test@gmail.com");
        String hashedEmail = userIdentifierService.hash("test@gmail.com");
        assertThat(userIdentifierService.getUserIdentifier(user)).isEqualTo(hashedEmail);
    }
}
