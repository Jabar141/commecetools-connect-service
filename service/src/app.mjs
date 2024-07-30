const {reviewProductChanges} = require('./filterProductChanges');
const express = require('express');
const app = express();
const port = 8080;

app.get('/',  (req, res) => {
  res.send('Hello World!');
  });
  

  app.post('/products/:id', async (req, res) => {
    var changes=await reviewProductChanges(req.params.id);
    res.send(changes);
    });
    
