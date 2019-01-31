const request = require('request')
    , config = require('config')
    , vue = require('vue')
    , vsr = require('vue-server-renderer')
    , fs = require('fs')

const renderer = vsr.createRenderer({
    template: fs.readFileSync('./views/index.template.html', 'utf-8')
})

var token = config.get('togglApiToken')
var togglAuth = "Basic " + new Buffer.from(token + ":" + 'api_token').toString("base64")

exports.get_entries = (req, res) => {
    var queryStr = '?start_date='
    var today = undefined
    if (req.query.startDate) {
        today = new Date(req.query.startDate)
        queryStr += today.toISOString() + "&end_date="
        today.setHours(today.getHours() + 24)
        queryStr += today.toISOString()
    }
    else {
        today = new Date()
        today.setHours(today.getHours() - (today.getTimezoneOffset() / 60))
        today = new Date(today.toDateString())
        queryStr += today.toISOString()
    }

    request({
        method: 'GET',
        url: 'https://www.toggl.com/api/v8/time_entries' + queryStr,
        headers: {
            "Authorization": togglAuth
        },
        json: true
    }, (error, response, body) => {
        if (error) {
            res.status(500).send(error.stack)
        }
        const context = {
            title: "Toggl Entries",
            meta: ''
        }
        var templateHtml = `
                <div>
                    <form action="http://127.0.0.1:8081/entries" method="GET">
                        <label for="startDate">Choose a date to view those entries:</label>
                        <input type="date" id="startDate" name="startDate" />
                        <input type="submit" value="Go">
                    </form>
                    <br />
                    <div v-if="togglEntries.length == 0">No entries for this day!</div>
                    <table cellpadding="5" v-else>
                        <th>Description</th>
                        <th>Start</th>
                        <th>End</th>
                        <tr v-for="entry in togglEntries">
                            <td><a v-bind:href="'http://127.0.0.1:8081/entries/' + entry.id">{{ entry.description }}</a></td>
                            <td>{{ new Date(entry.start).toDateString() + ' ' + new Date(entry.start).toLocaleTimeString() }}</td>
                            <td>{{ new Date(entry.stop).toDateString() + ' ' + new Date(entry.stop).toLocaleTimeString() }}</td>
                        </tr>
                    </table>
                </div>
        `

        const app = new vue({
            data: {
                togglEntries: body
            },
            template: templateHtml
        })

        renderer.renderToString(app, context, (err, html) => {
            if (err) {
                res.status(500).send(err.message)
            }
            res.send(html)
        })
    })
}

exports.get_entry = (req, res) => {
    if(!req.params.id) {
        res.status(500).send("No entry ID specified")
    }

    request({
        method: 'GET',
        url: 'https://www.toggl.com/api/v8/time_entries/' + req.params.id,
        headers: {
            "Authorization": togglAuth
        },
        json: true
    }, (error, response, body) => {
        if (error) {
            res.status(500).send(error.stack)
        }
        const context = {
            title: "Toggl Entry: " + body.data.description,
            meta: ''
        }
        var templateHtml = `
            <div>
                <table cellpadding="5">
                    <tr>
                        <td><b>Description:</b></td>
                        <td>{{ togglEntry.description }}</td>
                    </tr>
                    <tr>
                        <td><b>Start:</b></td>
                        <td>{{ new Date(togglEntry.start).toDateString() + ' ' + new Date(togglEntry.start).toLocaleTimeString() }}</td>
                    </tr>
                    <tr>
                        <td><b>End:</b></td>
                        <td>{{ new Date(togglEntry.stop).toDateString() + ' ' + new Date(togglEntry.stop).toLocaleTimeString() }}</td>
                    </tr>
                    <tr>
                        <td><b>Duration:</b></td>
                        <td>{{ (togglEntry.duration / 60 / 60).toFixed(2) + 'h' }}</td>
                    </tr>
                    <tr>
                        <td><b>Tags:</b></td>
                        <td><ul v-for="tag in togglEntry.tags"><li>{{ tag }}</li></ul></td>
                    </tr>
                </table>
            </div>
    `

        const app = new vue({
            data: {
                togglEntry: body.data
            },
            template: templateHtml
        })

        renderer.renderToString(app, context, (err, html) => {
            if (err) {
                res.status(500).send(err.message)
            }
            res.send(html)
        })
    })
}