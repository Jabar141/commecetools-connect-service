
const express = require('express');
const { reviewProductChanges } = require('./filterProductChanges');


const app = express();
const port = 8080;

app.get('/',  (req, res) => {
  res.send('Hello World!');
  });
  

  app.post('/products/:id', async (req, res) => {
    var changes=await reviewProductChanges(req.params.id);
    res.send(changes);
    });

  
      app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
      });
