const express = require('express');
const path = require('path');
const app = express();
const APP_NAME = 'bez';
let port = 8080;

if (process.argv.length > 2) {
  const p = parseInt(process.argv[2], 10);
  if (isNaN(p)) {
    console.error(`Invalid port number. Using default port ${port}.`);
  } else {
    port = p;
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})

app.listen(port, () => {
  console.log(`App ${APP_NAME} listening on port ${port}`);
})
