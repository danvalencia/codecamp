const client = require('./twitterClient')
const CacheManager = require('./cache')
const cache = new CacheManager('myproject')

const getFollowersIdsForUser = (user) => {
  const endpoint = 'followers/ids'
  const params = {
    screen_name: user
  }

  return new Promise((resolve, reject) => {
    cache.get(endpoint, user).then(cachedFollowerIds => {
      if (cachedFollowerIds.length === 0) {
        client().get(endpoint, params, (error, followerIds, response) => {
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
  const params = {
    screen_name: user
  }

  return new Promise((resolve, reject) => {
    cache.get(endpoint, user).then(cachedFriendsIds => {
      if (cachedFriendsIds.length === 0) {
        client().get(endpoint, params, (error, friendIds, response) => {
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
        client().get(endpoint, params, (error, users, response) => {
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

const intersection = (ids) => {
  const sortedFollowerIds = ids.reduce((a,b) => a.concat(b), []).sort()
  const commonFollowers = []

  sortedFollowerIds.reduce((a,b) => {
    if (a === b) {
      commonFollowers.push(a)
    }
    return b
  })
  return new Promise(resolve => resolve(commonFollowers))
}

const getCommonFollowers = (user1, user2) => {
  return Promise.all([
    getFollowersIdsForUser(user1),
    getFollowersIdsForUser(user2)
  ]).then((followerIds) => {
    return intersection(followerIds)
  })
}

const getCommonFriends = (user1, user2) => {
  return Promise.all([
    getFriendIdsForUser(user1),
    getFriendIdsForUser(user2)
  ]).then((friendIds) => {
    return intersection(friendIds)
  })
}

const buildGraph = (friends) => {
  const friendIds = friends.map(f => f.id)
  console.log("Friends Ids")
  console.log(friendIds)
  return Promise.all(friends.map(friend => getFriendIdsForUser(friend.id)))
}

Promise.all([
  getCommonFollowers('_DanValencia', 'hackergil'),
  getCommonFriends('_DanValencia', 'hackergil')
]).then((friendsAndFollowersIds) => {
  return intersection(friendsAndFollowersIds)
}).then((commonFriendsAndFollowersIds) => {
  return getScreenNameForAllUsers(commonFriendsAndFollowersIds)
 }).then((commonFriendsAndFollowers) => {
  return commonFriendsAndFollowers[0].map(u => {
    return {
      screenName: u.screen_name,
      id: u.id
    }
  })
}).then(friends => {
  console.log(friends)
}).catch(reason => console.log(reason))
