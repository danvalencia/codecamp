const Twitter = require('twitter');
const env = require('node-env-file');
const CacheManager = require('./cache')
const cache = new CacheManager('myproject')

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

const getFollowersIdsForUser = (user) =>  {
  const endpoint = 'followers/ids'

  let params = {}
  if (typeof user === 'number') {
    params = {
      user_id: user
    }
  } else {
    params = {
      screen_name: user
    }
  }

  return new Promise((resolve, reject) => {
    cache.get(endpoint, user).then(cachedFollowerIds => {
      if (cachedFollowerIds.length === 0) {
        getTwitter().get(endpoint, params, (error, followerIds, response) => {
          if (error) {
            reject(error)
          } else {
            cache.put(endpoint, user, followerIds.ids)
            resolve(followerIds.ids)
          }
        })
      } else {
        resolve(cachedFollowerIds[0].value)
      }
    })

  })
}

const getFriendIdsForUser = (user) => {
  const endpoint = 'friends/ids'

  let params = {}
  if (typeof user === 'number') {
    params = {
      user_id: user
    }
  } else {
    params = {
      screen_name: user
    }
  }

  return new Promise((resolve, reject) => {
    cache.get(endpoint, user).then(cachedFriendsIds => {
      if (cachedFriendsIds.length === 0) {
        getTwitter().get(endpoint, params, (error, friendIds, response) => {
          if (error) {
            reject(error)
          } else {
            cache.put(endpoint, user, friendIds.ids)
            resolve(friendIds.ids)
          }
        })
      } else {
        resolve(cachedFriendsIds[0].value)
      }
    })
  })
}

const computeKeyFor = (userIds) => {
  return userIds.reduce((a, b) => a + b)
}

const getScreenNamesForUsers = (userIds) => {
  const cacheKey = computeKeyFor(userIds.split(','))
  const endpoint = 'users/lookup'
  const params = {
    user_id: userIds
  }

  return new Promise((resolve, reject) => {
    cache.get(endpoint, cacheKey).then(cachedUsers => {
      if (cachedUsers.length === 0) {
        getTwitter().get(endpoint, params, (error, users, response) => {
          if (error) {
            reject(error)
          } else {
            cache.put(endpoint, cacheKey, users)
            resolve(users)
          }
        })
      } else {
        resolve(cachedUsers[0].value)
      }
    })
  })
}

const getScreenNameForAllUsers = (followerIds) => {
  const promiseArray = []
  while (followerIds.length > 0) {
    let ids = []
    if (followerIds.length > 100) {
      ids = followerIds.splice(0, 100)
    } else {
      ids = followerIds.splice(0)
    }
    promiseArray.push(getScreenNamesForUsers(ids.join(',')))
  }
  return Promise.all(promiseArray)
}



module.exports = {
  getScreenNameForAllUsers: getScreenNameForAllUsers,
  getScreenNamesForUsers: getScreenNamesForUsers,
  getFriendIdsForUser: getFriendIdsForUser,
  getFollowersIdsForUser: getFollowersIdsForUser
}
