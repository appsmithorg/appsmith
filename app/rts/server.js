const http = require("http")
const path = require("path")
const express = require("express")
const socketIO = require("socket.io")
const { MongoClient, ObjectId } = require("mongodb")
const axios = require("axios")

/**
 * Authentication: Can we connect to Redis directly to verify?
 *    Client sends cookie information to this server, just like it does to the Java backend.
 *    Server connects to Redis to verify. (Is this possible?)
 * Push to client: A socket.io connection established with the client can be used for bi-directional communication.
 *    Client says: Current user is now working on app1.
 *    Server says (to everyone else): user X is now working on app1.
 */

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

console.log("Connecting to MongoDB at", MONGODB_URI)

const ROOMS = {}

main()

function main() {
	const app = express()
	const server = http.Server(app)
	const io = socketIO(server, {
		// TODO: Remove this CORS configuration.
		cors: {
			origin: "*",
		},
	})

	const port = 8091

	app.get("/", (req, res) => {
		res.redirect("/index.html")
	})

	app.get("/info", (req, res) => {
		return res.json({ rooms: ROOMS })
	});

	io.on("connection", (socket) => {
		socket.join("default_room")
		onSocketConnected(socket)
			.catch((error) => console.error("Error in socket connected handler", error))
	})

	watchMongoDB(io)
		.catch((error) => console.error("Error watching MongoDB", error))

	app.use(express.static(path.join(__dirname, "static")))
	server.listen(port, () => {
		console.log(`Example app listening at http://localhost:${port}`)
	})
}

async function onSocketConnected(socket) {
	const connectionCookie = socket.handshake.headers.cookie
	console.log("new user connected with cookie", connectionCookie)

	socket.on("disconnect", () => {
		console.log("user disconnected", connectionCookie)
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
	let response;
	try {
		response = await axios.request({
			method: "GET",
			url: API_BASE_URL + "/applications/new",
			headers: {
				Cookie: cookie.match(/\bSESSION=\S+/)[0],
			},
		})
	} catch (error) {
		console.error("Error authenticating", error)
		return false
	}

	const email = response.data.data.user.email
	ROOMS[email] = []
	socket.join("email:" + email)
	for (const org of response.data.data.organizationApplications) {
		for (const app of org.applications) {
			ROOMS[email].push(app.id)
			console.log("Joining", app.id)
			socket.join("application:" + app.id)
		}
	}

	socket.on("disconnect", (reason) => {
		delete ROOMS[email]
	});

	return true
}

async function watchMongoDB(io) {
	const client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
	const db = client.db()

	const threadCollection = db.collection("commentThread")

	const commentChangeStream = db.collection("comment").watch();
	commentChangeStream.on("change", async (event) => {
		console.log("change comment", event)
		const comment = event.fullDocument
		const { applicationId } = await threadCollection.findOne({ _id: ObjectId(comment.threadId) }, { applicationId: 1 })
		const roomName = "application:" + applicationId
		const eventName = event.operationType + ":" + event.ns.coll
		console.log("Emitting to room '" + roomName + "', event '" + eventName + "'.", comment)
		io.to(roomName).emit(eventName, { comment })
	})

	const threadChangeStream = threadCollection.watch();
	threadChangeStream.on("change", (event) => {
		console.log("change thread", event)
		const comment = event.fullDocument
		const roomName = "application:" + comment.applicationId
		const eventName = event.operationType + ":" + event.ns.coll
		console.log("Emitting to room '" + roomName + "', event '" + eventName + "'.", comment)
		io.to(roomName).emit(eventName, { comment })
	})

	process.on("exit", () => {
		(commentChangeStream != null ? commentChangeStream.close() : Promise.bind(client).resolve())
			.then(client.close.bind(client))
			.finally("Fin")
	})

	console.log("Watching MongoDB")
}
