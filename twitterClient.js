const Twitter = require('twitter');
const env = require('node-env-file');

env('.env');
const consumerKeys = process.env.CONSUMER_KEYS.split(',')
const consumerSecrets = process.env.CONSUMER_SECRETS.split(',')
const accessTokenKeys = process.env.ACCESS_KEYS.split(',')
const accessTokenSecrets = process.env.ACCESS_SECRETS.split(',')

const clients = []

for (var i = 0; i < consumerKeys.length; i++) {
  clients.push(new Twitter({
    consumer_key: consumerKeys[i],
    consumer_secret: consumerSecrets[i],
    access_token_key: accessTokenKeys[i],
    access_token_secret: accessTokenSecrets[i]
  }))
}

let count = 0;
const getTwitter = () => {
  const theClient = clients[count++]
  if (count > clients.length - 1) {
    count = 0
  }
  return theClient
}

module.exports = getTwitter
