package com.appsmith.server.repositories;

import com.appsmith.server.domains.Notification;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;


@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class CustomNotificationRepositoryImplTest {

    @Autowired
    private NotificationRepository notificationRepository;

    @AfterEach
    public void afterTest() {
        notificationRepository.deleteAll();
    }

    private Notification createNotification(String forUsername, boolean isRead) {
        Notification notification = new Notification();
        notification.setForUsername(forUsername);
        notification.setIsRead(isRead);
        return notification;
    }

    @Test
    public void updateIsReadByForUsernameAndIdList_WhenUsernameNotMatched_UpdatesNone() {
        Mono<Notification> saveMono1 = notificationRepository.save(createNotification("abc", false));
        Mono<Notification> saveMono2 = notificationRepository.save(createNotification("efg", false));

        // create the notifications and then try to update them by different username
        Mono<Tuple2<Notification, Notification>> tuple2Mono = Mono.zip(saveMono1, saveMono2).flatMap(objects -> {
            Notification n1 = objects.getT1();
            Notification n2 = objects.getT2();
            return notificationRepository.updateIsReadByForUsernameAndIdList(
                    "123", List.of(n1.getId(), n2.getId()), true
            ).thenReturn(objects);
        });

        // now get the notifications we created
        Mono<List<Notification>> listMono = tuple2Mono.flatMap(objects -> {
            Notification n1 = objects.getT1();
            Notification n2 = objects.getT2();
            return notificationRepository.findAllById(List.of(n1.getId(), n2.getId())).collectList();
        });

        // check that fetched notifications have isRead=false
        StepVerifier.create(listMono).assertNext(notifications -> {
            assertEquals(2, notifications.size());
            assertEquals(false, notifications.get(0).getIsRead());
            assertEquals(false, notifications.get(1).getIsRead());
        }).verifyComplete();
    }

    @Test
    public void updateIsReadByForUsernameAndIdList_WhenUsernameMatched_Updated() {
        Mono<Notification> saveMono1 = notificationRepository.save(createNotification("abc", false));
        Mono<Notification> saveMono2 = notificationRepository.save(createNotification("abc", false));

        // create the notifications and then try to update them by same username
        Mono<Tuple2<Notification, Notification>> tuple2Mono = Mono.zip(saveMono1, saveMono2).flatMap(objects -> {
            Notification n1 = objects.getT1();
            Notification n2 = objects.getT2();
            return notificationRepository.updateIsReadByForUsernameAndIdList(
                    "abc", List.of(n1.getId(), n2.getId()), true
            ).thenReturn(objects);
        });

        // now get the notifications we created
        Mono<List<Notification>> listMono = tuple2Mono.flatMap(objects -> {
            Notification n1 = objects.getT1();
            Notification n2 = objects.getT2();
            return notificationRepository.findAllById(List.of(n1.getId(), n2.getId())).collectList();
        });

        // check that fetched notifications have isRead=true
        StepVerifier.create(listMono).assertNext(notifications -> {
            assertEquals(2, notifications.size());
            assertEquals(true, notifications.get(0).getIsRead());
            assertEquals(true, notifications.get(1).getIsRead());
        }).verifyComplete();
    }

    @Test
    public void updateIsReadByForUsernameAndIdList_WhenIdNotMatched_UpdatesNone() {
        Mono<Notification> saveMono1 = notificationRepository.save(createNotification("abc", false));
        Mono<Notification> saveMono2 = notificationRepository.save(createNotification("abc", false));

        // create the notifications and then try to update them by different username
        Mono<Tuple2<Notification, Notification>> tuple2Mono = Mono.zip(saveMono1, saveMono2).flatMap(objects -> {
            Notification n1 = objects.getT1();
            Notification n2 = objects.getT2();
            return notificationRepository.updateIsReadByForUsernameAndIdList(
                    "abc", List.of("test-id-1", "test-id-2"), true
            ).thenReturn(objects);
        });

        // now get the notifications we created
        Mono<List<Notification>> listMono = tuple2Mono.flatMap(objects -> {
            Notification n1 = objects.getT1();
            Notification n2 = objects.getT2();
            return notificationRepository.findAllById(List.of(n1.getId(), n2.getId())).collectList();
        });

        // check that fetched notifications have isRead=true
        StepVerifier.create(listMono).assertNext(notifications -> {
            assertEquals(2, notifications.size());
            assertEquals(false, notifications.get(0).getIsRead());
            assertEquals(false, notifications.get(1).getIsRead());
        }).verifyComplete();
    }

    @Test
    public void updateIsReadByForUsername_WhenForUsernameMatched_UpdatesMatchedOnes() {
        Mono<Notification> saveMono1 = notificationRepository.save(createNotification("abc", false));
        Mono<Notification> saveMono2 = notificationRepository.save(createNotification("abc", false));
        Mono<Notification> saveMono3 = notificationRepository.save(createNotification("efg", false));

        // create the notifications and then try to update them by same username
        Mono<Tuple3<Notification, Notification, Notification>> tuple2Mono = Mono.zip(
                saveMono1, saveMono2, saveMono3
        ).flatMap(objects ->
                notificationRepository.updateIsReadByForUsername("abc", true).thenReturn(objects)
        );

        // now get the notifications we created
        Mono<Map<String, Collection<Notification>>> mapMono = tuple2Mono.flatMap(objects -> {
            Notification n1 = objects.getT1();
            Notification n2 = objects.getT2();
            Notification n3 = objects.getT3();
            return notificationRepository.findAllById(
                    List.of(n1.getId(), n2.getId(), n3.getId())
            ).collectMultimap(Notification::getForUsername);
        });

        // check that fetched notifications have isRead=true
        StepVerifier.create(mapMono).assertNext(notificationCollectionMap -> {
            assertEquals(2, notificationCollectionMap.size()); // should contain map of two keys

            Notification forEfg = notificationCollectionMap.get("efg").iterator().next();
            assertEquals(false, forEfg.getIsRead()); // this should be still unread

            notificationCollectionMap.get("abc").iterator().forEachRemaining(notification -> {
                assertEquals(true, notification.getIsRead());
            });
        }).verifyComplete();
    }
}