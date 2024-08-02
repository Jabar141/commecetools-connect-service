
const express = require('express');
const { reviewProductChanges } = require('./filterProductChanges');
const { introspectToken } = require('./introspect');


const app = express();
const port = 8081;

app.use(express.json())
app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.post('/products/:id', async (req, res) => {
  var changes = await reviewProductChanges(req.params.id);
  res.send(changes);
});

app.post('/validateProducts', async (req, res) => {
  console.log(req.body.resource.id);
  var token = await introspectToken(req.headers.authorization);
  if (token.active == false) {
    res.status(401).send(token);
  }
  else {
    var changes = await reviewProductChanges(req.body.resource.id);
    res.send(changes);
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

