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

const API_BASE_URL = "http://localhost:8080/api/v1"

main()

function main() {
	const app = express()
	const server = http.Server(app)
	const io = socketIO(server)

	const port = 8091

	app.get("/", (req, res) => {
		res.redirect("/index.html")
	})

	io.on("connection", (socket) => {
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
		let response;
		try {
			response = await axios.request({
				method: "GET",
				url: API_BASE_URL + "/applications/new",
				headers: {
					Cookie: connectionCookie.match(/\bSESSION=\S+/)[0],
				},
			})
		} catch (error) {
			console.error("Error authenticating", error)
			isAuthenticated = false
			return
		}

		console.log("Response from backend", response.data)
        const email = response.data.data.user.email
		socket.join("email:" + email)
		for (const org of response.data.data.organizationApplications) {
			for (const app of org.applications) {
				console.log("Joining", app.id)
				socket.join("application:" + app.id)
			}
		}

	}

	socket.emit("authStatus", { isAuthenticated })
}

async function watchMongoDB(io) {
	const client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
	await client.connect()

	const db = client.db("mobtools");

	const threadCollection = db.collection("commentThread")

	const commentChangeStream = db.collection("comment").watch();
	commentChangeStream.on("change", async (event) => {
	    console.log("change comment", event)
		const comment = event.fullDocument
        const { applicationId } = await threadCollection.findOne({ _id: ObjectId(comment.threadId) }, { applicationId: 1 })
		const roomName = "application:" + applicationId
		io.to(roomName).emit(event.operationType + ":" + event.ns.coll, { comment })
	})

	const threadChangeStream = threadCollection.watch();
	threadChangeStream.on("change", (event) => {
		const roomName = "application:" + event.fullDocument.applicationId
        console.log("Sending change:thread to", roomName)
		io.to(roomName).emit(event.operationType + ":" + event.ns.coll, { comment: event.fullDocument })
	})

	process.on("exit", () => {
		(commentChangeStream != null ? commentChangeStream.close() : Promise.bind(client).resolve())
			.then(client.close.bind(client))
			.finally("Fin")
	})

	console.log("Watching MongoDB")
}
