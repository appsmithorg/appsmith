window.onload = () => {

	const socket = io();
	// const socket = io("ws://localhost:8092");

	m.mount(root, { view: () => m(RootView, { socket }) });

}

function RootView(initialVnode) {
	const socket = initialVnode.attrs.socket
	let isAuthenticated = false
	const log = []

	socket.onAny((name, msg) => {
		console.log(name, msg)
	});

	socket.on("change:thread", ({comment}) => {
		log.push(comment)
		m.redraw()
	});

	socket.on("authStatus", (msg) => {
		isAuthenticated = !!msg.isAuthenticated
		m.redraw()
	});

	return { view }

	function view() {
		return [
			m("h1", "Ready"),
			m("p", isAuthenticated ? "Authenticated." : "Not Authenticated."),
			m("h2", "Message Log"),
			m("pre", JSON.stringify(log, null, 4)),
		]
	}

}
