const express = require('express');
const app = express();

require('dotenv').config()
require('./routes')(app);

app.listen(process.env.PORT, function () {
    console.log('App listening on port 3000!');
});
