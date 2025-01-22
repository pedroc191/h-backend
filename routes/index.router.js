const express = require('express');
const app = express.Router();

app.get('/', function(req, res, next) {

    res.render('main/index')
});
module.exports = app;
