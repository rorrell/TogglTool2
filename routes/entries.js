const express = require("express")
    , togglController = require('../controllers/togglController')

var router = express.Router()

router.get('/', (req, res) => {
    res.redirect('/entries')
})

router.get('/entries', togglController.get_entries)

router.get('/entries/:id', togglController.get_entry)

module.exports = router