const express = require("express")
var entries = require('./routes/entries')

var server = express()
server.use(entries)
server.listen('8081')