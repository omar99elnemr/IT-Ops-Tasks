import app from '../dist/server.js';

export default function handler(req, res) {
	const incoming = req.url || '/';
	if (!incoming.startsWith('/api')) {
		req.url = incoming === '/' ? '/api' : `/api${incoming}`;
	}
	return app(req, res);
}
