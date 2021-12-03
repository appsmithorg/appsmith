package com.appsmith.server.featureflags.strategies;

import com.appsmith.server.domains.User;
import lombok.extern.slf4j.Slf4j;
import org.ff4j.core.FlippingExecutionContext;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;

import java.util.HashMap;
import java.util.Map;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class EmailBasedRolloutStrategyTest {

    EmailBasedRolloutStrategy strategy = new EmailBasedRolloutStrategy();

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {
        Map<String, String> initParams = new HashMap<>();
        initParams.put("emailDomains", "example.com,another-example.com");
        strategy.init("test-feature", initParams);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testValidFeatureCheck() {
        FlippingExecutionContext executionContext = Mockito.mock(FlippingExecutionContext.class);

        User user = new User();
        user.setEmail("test@EXAMPLE.com");
        Mockito.when(executionContext.getValue(Mockito.anyString(), Mockito.anyBoolean())).thenReturn(user);

        boolean evaluate = strategy.evaluate("test-feature", null, executionContext);
        assertTrue(evaluate);
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidFeatureCheck() {
        FlippingExecutionContext executionContext = Mockito.mock(FlippingExecutionContext.class);

        User user = new User();
        user.setEmail("test@random.com");
        Mockito.when(executionContext.getValue(Mockito.anyString(), Mockito.anyBoolean())).thenReturn(user);

        boolean evaluate = strategy.evaluate("test-feature", null, executionContext);
        assertFalse(evaluate);
    }
}
