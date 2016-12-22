const express = require('express')
const app = express()
const createCommonFollowerGraph = require('./twitterGraphGenerator')


app.get('/', function (req, res) {
  console.log(req.query)
  const user1 = req.query.user1
  const user2 = req.query.user2

  if (!user1 || !user2) {
    console.log(`User 1 and user 2 are both required ${user1} ${user2}`)
    res.sendStatus(400)
    res.send("user1 and user2 are required query parameters")
  } else {
    createCommonFollowerGraph(user1, user2).then(graph => {
      res.send(graph)
    })
  }
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
