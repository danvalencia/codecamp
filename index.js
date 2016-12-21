const client = require('./twitterClient')
const CacheManager = require('./cache')
const cache = new CacheManager('myproject')

const getFollowersIdsForUser = (user) => {
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

const intersection = (arr1, arr2) => {
  const sortedArr = arr1.concat(arr2).sort()
  const intersectionArr = []

  sortedArr.reduce((a,b) => {
    if (a === b) {
      intersectionArr.push(a)
    }
    return b
  })
  return new Promise(resolve => resolve(intersectionArr))
}

const getCommonFollowers = (user1, user2) => {
  return Promise.all([
    getFollowersIdsForUser(user1),
    getFollowersIdsForUser(user2)
  ]).then((followerIds) => {
    return intersection(followerIds[0], followerIds[1])
  })
}

const getCommonFriends = (user1, user2) => {
  return Promise.all([
    getFriendIdsForUser(user1),
    getFriendIdsForUser(user2)
  ]).then((friendIds) => {
    return intersection(friendIds[0], friendIds[1])
  })
}

const buildGraph = (friendIds) => {
  console.log("Friends Ids")
  console.log(friendIds)
  const friendPromises = []

  friendIds.forEach(friend => {
    friendPromises.push(
      getFriendIdsForUser(friend).then(friendsOfFriend => {
        return {id: friend, friends: friendsOfFriend}
      })
    )
  })

  return Promise.all(friendPromises).then(friendMaps => {
    const commonFriends = friendMaps.map(f => f.id)
    const graphPromise = [] // Graph will be a [id, [edge1, edge2]]
    friendMaps.forEach(friend => {
      graphPromise.push(
        intersection(commonFriends, friend.friends)
        .then( friendsIntersection => {
          console.log("Intersection")
          console.log(friendsIntersection)
          return [friend.id, friendsIntersection]
        })
      )
    })
    return Promise.all(graphPromise)
  })
}

Promise.all([
  getCommonFollowers('_DanValencia', 'hackergil'),
  getCommonFriends('_DanValencia', 'hackergil')
]).then((friendsAndFollowersIds) => {
  return intersection(friendsAndFollowersIds[0], friendsAndFollowersIds[1])
}).then((commonFriendsAndFollowersIds) => {
  return buildGraph(commonFriendsAndFollowersIds)
}).then((friendGraph) => {
  console.log("The Graph")
  console.log(friendGraph)
}).catch(reason => console.log(reason))
