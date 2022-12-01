import type mongodb from "mongodb";
import log from "loglevel";
import { MongoClient } from "mongodb";
import { CommentThread, Comment } from "@utils/models";
import { findPolicyEmails } from "@controllers/socket";

const MONGODB_URI = process.env.APPSMITH_MONGODB_URI;

export async function watchMongoDB(io) {
  const client = await MongoClient.connect(MONGODB_URI, {
    useUnifiedTopology: true,
  });
  const db = client.db();

  const threadCollection: mongodb.Collection<CommentThread> =
    db.collection("commentThread");

  const commentChangeStream = db.collection("comment").watch(
    [
      // Prevent server-internal fields from being sent to the client.
      {
        $unset: ["deletedAt", "_class"].map((f) => "fullDocument." + f),
      },
    ],
    { fullDocument: "updateLookup" }
  );

  commentChangeStream.on(
    "change",
    async (event: mongodb.ChangeEventCR<Comment>) => {
      let eventName = event.operationType + ":" + event.ns.coll;

      const comment: Comment = event.fullDocument;
      if (comment.deleted) {
        eventName = "delete" + ":" + event.ns.coll; // emit delete event if deleted=true
      }

      comment.creationTime = comment.createdAt;
      comment.updationTime = comment.updatedAt;

      delete comment.createdAt;
      delete comment.updatedAt;
      delete comment.deleted;

      let target = io;
      let shouldEmit = false;

      for (const email of findPolicyEmails(comment.policies, "read:comments")) {
        shouldEmit = true;
        target = target.to("email:" + email);
      }

      if (shouldEmit) {
        target.emit(eventName, { comment });
      }
    }
  );

  const threadChangeStream = threadCollection.watch(
    [
      // Prevent server-internal fields from being sent to the client.
      {
        $unset: ["deletedAt", "_class"].map((f) => "fullDocument." + f),
      },
    ],
    { fullDocument: "updateLookup" }
  );

  threadChangeStream.on("change", async (event: mongodb.ChangeEventCR) => {
    let eventName = event.operationType + ":" + event.ns.coll;

    const thread = event.fullDocument;
    if (thread.deleted) {
      eventName = "delete" + ":" + event.ns.coll; // emit delete event if deleted=true
    }

    if (thread === null) {
      // This happens when `event.operationType === "drop"`, when a comment is deleted.
      log.error("Null document recieved for comment change event", event);
      return;
    }

    thread.creationTime = thread.createdAt;
    thread.updationTime = thread.updatedAt;

    delete thread.createdAt;
    delete thread.updatedAt;
    delete thread.deleted;

    thread.isViewed = false;

    let target = io;
    let shouldEmit = false;

    for (const email of findPolicyEmails(
      thread.policies,
      "read:commentThreads"
    )) {
      shouldEmit = true;
      target = target.to("email:" + email);
    }

    if (shouldEmit) {
      target.emit(eventName, { thread });
    }
  });

  const notificationsStream = db.collection("notification").watch(
    [
      // Prevent server-internal fields from being sent to the client.
      {
        $unset: ["deletedAt", "deleted"].map((f) => "fullDocument." + f),
      },
    ],
    { fullDocument: "updateLookup" }
  );

  notificationsStream.on("change", async (event: mongodb.ChangeEventCR) => {
    const notification = event.fullDocument;

    if (notification === null) {
      // This happens when `event.operationType === "drop"`, when a notification is deleted.
      log.error("Null document recieved for notification change event", event);
      return;
    }

    // set the type from _class attribute
    notification.type = notification._class.slice(
      notification._class.lastIndexOf(".") + 1
    );
    delete notification._class;

    const eventName = event.operationType + ":" + event.ns.coll;
    io.to("email:" + notification.forUsername).emit(eventName, {
      notification,
    });
  });

  process.on("uncaughtExceptionMonitor", (err, origin) => {
    log.error(`Caught exception: ${err}\n` + `Exception origin: ${origin}`);
  });

  process.on("unhandledRejection", (reason, promise) => {
    log.debug("Unhandled Rejection at:", promise, "reason:", reason);
  });

  process.on("exit", () => {
    (commentChangeStream != null
      ? commentChangeStream.close()
      : Promise.bind(client).resolve()
    )
      .then(client.close.bind(client))
      .finally("Fin");
  });

  log.debug("Watching MongoDB");
}
