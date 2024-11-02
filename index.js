const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
app.use(express.static(path.join(__dirname, 'build')));

app.get('/', (req, res) => {
	res.send(`Go to: http://localhost:${PORT}/home.html`);
});

app.listen(PORT, () => {
	console.log(`Server Established on port ${PORT}, view project a:\nhttp://localhost:${PORT}/home.html`);
});
