import http from "http"
import path from "path"
import express from "express"
import SocketIO from "socket.io"
import { MongoClient, ObjectId } from "mongodb"
import type mongodb from "mongodb"
import axios from "axios"
import { AppUser, CurrentAppEditorEvent, Policy, Comment, CommentThread } from "./models"

const APP_ROOM_PREFIX : string = "app:"
const APP_EDITORS_EVENT_NAME : string = "collab:online_app_editors"
const START_APP_EDIT_EVENT_NAME : string = "collab:start_edit_app"
const LEAVE_APP_EDIT_EVENT_NAME : string = "collab:leave_edit_app"

const MONGODB_URI = process.env.APPSMITH_MONGODB_URI
if (MONGODB_URI == null || MONGODB_URI === "" || !MONGODB_URI.startsWith("mongodb")) {
	console.error("Please provide a valid value for `APPSMITH_MONGODB_URI`.")
	process.exit(1)
}

const API_BASE_URL = process.env.APPSMITH_API_BASE_URL
if (API_BASE_URL == null || API_BASE_URL === "") {
	console.error("Please provide a valid value for `APPSMITH_API_BASE_URL`.")
	process.exit(1)
}

main()

function main() {
	const app = express()
	const server = new http.Server(app)
	const io = new SocketIO.Server(server, {
		// TODO: Remove this CORS configuration.
		cors: {
			origin: "*",
		},
	})

	const port = 8091

	app.get("/", (req, res) => {
		res.redirect("/index.html")
	})

	io.on("connection", (socket) => {
		socket.join("default_room")
		onSocketConnected(socket)
			.catch((error) => console.error("Error in socket connected handler", error))
	})

	io.of("/").adapter.on("leave-room", (room, id) => {
		// console.log(`${id} left room ${room}`);
		sendCurrentUsers(io, room);
	});
	
	io.of("/").adapter.on("join-room", (room, id) => {
		// console.log(`${id} joined room ${room}`);
		sendCurrentUsers(io, room);
	});

	watchMongoDB(io)
		.catch((error) => console.error("Error watching MongoDB", error))

	app.use(express.static(path.join(__dirname, "static")))
	server.listen(port, () => {
		console.log(`RTS running at http://localhost:${port}`)
	})
}

async function onSocketConnected(socket) {
	const connectionCookie = socket.handshake.headers.cookie
	// console.log("new user connected with cookie", connectionCookie)

	socket.on("disconnect", () => {
		// console.log("user disconnected", connectionCookie)
	})

	let isAuthenticated = true

	if (connectionCookie != null && connectionCookie !== "") {
		isAuthenticated = await tryAuth(socket, connectionCookie)
		socket.emit("authStatus", { isAuthenticated })
	}

	socket.on("auth", async ({ cookie }) => {
		isAuthenticated = await tryAuth(socket, cookie)
		socket.emit("authStatus", { isAuthenticated })
	});
}

async function tryAuth(socket, cookie) {
	const sessionCookie = cookie.match(/\bSESSION=\S+/)[0]
	let response
	try {
		response = await axios.request({
			method: "GET",
			url: API_BASE_URL + "/api/v1/users/me",
			headers: {
				Cookie: sessionCookie,
			},
		})
	} catch (error) {
		if (error.response?.status === 401) {
			console.info("Couldn't authenticate user with cookie:")
		} else {
			console.error("Error authenticating", error)
		}
		return false
	}

	const email = response.data.data.email
	const name = response.data.data.name ? response.data.data.name : email;

	socket.data.email = email
	socket.data.name = name
	
	socket.join("email:" + email)
	
	socket.on(START_APP_EDIT_EVENT_NAME, (appId) => {
        // remove this socket from any other app rooms
        socket.rooms.forEach(roomName => {
            if(roomName.startsWith(APP_ROOM_PREFIX)) {
                socket.leave(roomName);
            }
        });

        // add this socket to room with application id
        let roomName = APP_ROOM_PREFIX + appId;
        socket.join(roomName);
    });

    socket.on(LEAVE_APP_EDIT_EVENT_NAME, (appId) => {
        let roomName = APP_ROOM_PREFIX + appId;
        // remove this socket from app room
        socket.leave(roomName);
    });

	socket.on("disconnect", (reason) => {
		// delete ROOMS[email]
	});

	return true
}

async function watchMongoDB(io) {
	const client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
	const db = client.db()

	const threadCollection: mongodb.Collection<CommentThread> = db.collection("commentThread")

	const commentChangeStream = db.collection("comment").watch(
		[
			// Prevent server-internal fields from being sent to the client.
			{
				$unset: [
					"deletedAt",
					"deleted",
					"_class",
				].map(f => "fullDocument." + f)
			},
		],
		{ fullDocument: "updateLookup" }
	);

	commentChangeStream.on("change", async (event: mongodb.ChangeEventCR<Comment>) => {
		// console.log("comment event", event)
		const comment: Comment = event.fullDocument
		const { applicationId }: CommentThread = await threadCollection.findOne(
			{ _id: new ObjectId(comment.threadId) },
			{ projection: { applicationId: 1 } },
		)

		comment.creationTime = comment.createdAt
		comment.updationTime = comment.updatedAt
		delete comment.createdAt
		delete comment.updatedAt

		let target = io
		let shouldEmit = false

		for (const email of findPolicyEmails(comment.policies, "read:comments")) {
			shouldEmit = true
			// console.log("Emitting comment to email", email)
			target = target.to("email:" + email)
		}

		if (shouldEmit) {
			const eventName = event.operationType + ":" + event.ns.coll
			// console.log("Emitting", eventName)
			target.emit(eventName, { comment })
		}
	})

	const threadChangeStream = threadCollection.watch(
		[
			// Prevent server-internal fields from being sent to the client.
			{
				$unset: [
					"deletedAt",
					"deleted",
					"_class",
				].map(f => "fullDocument." + f)
			},
		],
		{ fullDocument: "updateLookup" }
	);

	threadChangeStream.on("change", async (event: mongodb.ChangeEventCR) => {
		// console.log("thread event", event)
		const thread = event.fullDocument
		if (thread == null) {
			// This happens when `event.operationType === "drop"`, when a comment is deleted.
			console.error("Null document recieved for comment change event", event)
			return
		}

		thread.creationTime = thread.createdAt
		thread.updationTime = thread.updatedAt
		delete thread.createdAt
		delete thread.updatedAt
		thread.isViewed = false

		let target = io
		let shouldEmit = false

		for (const email of findPolicyEmails(thread.policies, "read:commentThreads")) {
			shouldEmit = true
			// console.log("Emitting thread to email", email)
			target = target.to("email:" + email)
		}

		if (shouldEmit) {
			const eventName = event.operationType + ":" + event.ns.coll
			// console.log("Emitting", eventName)
			target.emit(eventName, { thread })
		}
	})

	const notificationsStream = db.collection("notification").watch(
		[
			// Prevent server-internal fields from being sent to the client.
			{
				$unset: [
					"deletedAt",
					"deleted",
				].map(f => "fullDocument." + f)
			},
		],
		{ fullDocument: "updateLookup" }
	);

	notificationsStream.on("change", async (event: mongodb.ChangeEventCR) => {
		// console.log("notification event", event)
		const notification = event.fullDocument

		if (notification == null) {
			// This happens when `event.operationType === "drop"`, when a notification is deleted.
			console.error("Null document recieved for notification change event", event)
			return
		}

		// set the type from _class attribute
		notification.type = notification._class.substr(notification._class.lastIndexOf(".") + 1)
		delete notification._class
		
		const eventName = event.operationType + ":" + event.ns.coll
		io.to("email:" + notification.forUsername).emit(eventName, { notification })
	})

	process.on("exit", () => {
		(commentChangeStream != null ? commentChangeStream.close() : Promise.bind(client).resolve())
			.then(client.close.bind(client))
			.finally("Fin")
	})

	console.log("Watching MongoDB")
}

function findPolicyEmails(policies: Policy[], permission: string): string[] {
	const emails: string[] = []
	for (const policy of policies) {
		if (policy.permission === permission) {
			for (const email of policy.users) {
				// console.log("Emitting comment to email", email)
				emails.push(email)
			}
			break
		}
	}
	return emails
}

function sendCurrentUsers(socketIo, roomName:string) {
	if(roomName.startsWith(APP_ROOM_PREFIX)) {
		socketIo.in(roomName).fetchSockets().then(sockets => {
			let onlineUsernames = new Set<string>();
			let onlineUsers = new Array<AppUser>();
			if(sockets) {
				sockets.forEach(s => {
					if(!onlineUsernames.has(s.data.email)) {
						onlineUsers.push(new AppUser(s.data.name, s.data.email));
					}
					onlineUsernames.add(s.data.email);
				});
			}
			let appId = roomName.replace(APP_ROOM_PREFIX, "") // get app id from room name by removing the prefix
			let response = new CurrentAppEditorEvent(appId, onlineUsers);
			socketIo.to(roomName).emit(APP_EDITORS_EVENT_NAME, response);
		});
	}
}