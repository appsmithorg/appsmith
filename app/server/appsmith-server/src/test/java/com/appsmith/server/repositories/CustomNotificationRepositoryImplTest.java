package com.appsmith.server.repositories;

import com.appsmith.server.domains.Comment;
import com.appsmith.server.domains.CommentNotification;
import com.appsmith.server.domains.Notification;
import lombok.extern.slf4j.Slf4j;
import org.junit.After;
import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuple3;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;


@RunWith(SpringRunner.class)
@SpringBootTest
@Slf4j
public class CustomNotificationRepositoryImplTest {

    @Autowired
    private NotificationRepository notificationRepository;

    @After
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
            Assert.assertEquals(2, notifications.size());
            Assert.assertEquals(false, notifications.get(0).getIsRead());
            Assert.assertEquals(false, notifications.get(1).getIsRead());
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
            Assert.assertEquals(2, notifications.size());
            Assert.assertEquals(true, notifications.get(0).getIsRead());
            Assert.assertEquals(true, notifications.get(1).getIsRead());
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
            Assert.assertEquals(2, notifications.size());
            Assert.assertEquals(false, notifications.get(0).getIsRead());
            Assert.assertEquals(false, notifications.get(1).getIsRead());
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
            notificationRepository.updateIsReadByForUsername("abc",true).thenReturn(objects)
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
            Assert.assertEquals(2, notificationCollectionMap.size()); // should contain map of two keys

            Notification forEfg = notificationCollectionMap.get("efg").iterator().next();
            Assert.assertEquals(false, forEfg.getIsRead()); // this should be still unread

            notificationCollectionMap.get("abc").iterator().forEachRemaining(notification -> {
                Assert.assertEquals(true, notification.getIsRead());
            });
        }).verifyComplete();
    }

    private CommentNotification createCommentNotification(String authorId, String authorName) {
        CommentNotification commentNotification = new CommentNotification();
        commentNotification.setComment(new Comment());
        commentNotification.getComment().setAuthorId(authorId);
        commentNotification.getComment().setAuthorName(authorName);
        return commentNotification;
    }

    @Test
    public void updateCommentAuthorNames_WhenNameChanged_NamesUpdated() {
        String authorOneId = "author-1",
                authorTwoId = "author-2",
                oldName = "Old name",
                updatedName = "New name";

        List<Notification> notificationList = List.of(
                createCommentNotification(authorOneId, oldName),
                createCommentNotification(authorOneId, oldName),
                createCommentNotification(authorTwoId, oldName)
        );

        Mono<Map<String, Collection<Notification>>> mapMono = notificationRepository
                .saveAll(notificationList)// save the above 3 notifications
                .collectList()
                .flatMap(notifications ->
                        // update the author names
                        notificationRepository.updateCommentAuthorNames(authorOneId, updatedName)
                                .then(Mono.just(notifications)) // return the saved objects
                )
                .flatMap(notifications -> {
                    // now fetch the saved notifications again by id
                    Stream<String> idStream = notifications.stream().map(notification -> notification.getId());
                    List<String> idList = idStream.collect(Collectors.toList()); // get the list of id from objects
                    return notificationRepository.findAllById(idList)
                            .collectMultimap(notification ->
                                    // create a map of author id and list of objects for better assertions
                                    ((CommentNotification) notification).getComment().getAuthorId()
                            );
                });

        StepVerifier.create(mapMono).assertNext(authorIdNotificationMap -> {
            assertThat(authorIdNotificationMap.size()).isEqualTo(2);
            assertThat(authorIdNotificationMap.get(authorOneId).size()).isEqualTo(2);
            for(Notification notification: authorIdNotificationMap.get(authorOneId)) {
                CommentNotification commentNotification = (CommentNotification) notification;
                // should have updated name
                assertThat(commentNotification.getComment().getAuthorName()).isEqualTo("New name");
            }
            assertThat(authorIdNotificationMap.get(authorTwoId).size()).isEqualTo(1);
            for(Notification notification: authorIdNotificationMap.get(authorTwoId)) {
                CommentNotification commentNotification = (CommentNotification) notification;
                // name should be unchanged
                assertThat(commentNotification.getComment().getAuthorName()).isEqualTo(oldName);
            }
        }).verifyComplete();

    }
}