const axios = require('axios');
let data = '';


module.exports.introspectToken = async(token) =>{
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://auth.us-central1.gcp.commercetools.com/oauth/introspect?token='+token,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Basic eFBOd0Z6M1Fob29RMHVScXdmaFVuUHUwOkh0NVZYNmd3aUVyS1FrMU5JaW43cFR0YldSY05FeXh0'
        },
        data : data
      };
var tokenResponse=await axios.request(config);
return tokenResponse.data;
}
