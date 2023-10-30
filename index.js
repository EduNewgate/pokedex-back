const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

var appRoutes = require('./routes/app');
var listadoPkmnRoutes = require('./routes/listadoPkmn');
app.use('/listadoPkmn', listadoPkmnRoutes);
app.use('/', appRoutes);

app.listen(3000,() => console.log("Server listening at port 3000"));