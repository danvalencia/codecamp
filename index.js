const TwitterClient = require('./twitterClient')

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
    TwitterClient.getFollowersIdsForUser(user1),
    TwitterClient.getFollowersIdsForUser(user2)
  ]).then((followerIds) => {
    return intersection(followerIds[0], followerIds[1])
  })
}

const getCommonFriends = (user1, user2) => {
  return Promise.all([
    TwitterClient.getFriendIdsForUser(user1),
    TwitterClient.getFriendIdsForUser(user2)
  ]).then((friendIds) => {
    return intersection(friendIds[0], friendIds[1])
  })
}

const buildGraph = (friendIds) => {
  const friendPromises = []

  friendIds.forEach(friend => {
    friendPromises.push(
      TwitterClient.getFriendIdsForUser(friend).then(friendsOfFriend => {
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
          return [friend.id, friendsIntersection]
        })
      )
    })
    return Promise.all(graphPromise)
  })
}

const convertToTGF = (graphContainer) => {
  const tgfArray = []
  for(key in graphContainer.userScreenNameMap) {
    tgfArray.push(`${key} ${graphContainer.userScreenNameMap[key]}\n`)
  }

  tgfArray.push('#', '\n')

  graphContainer.graph.forEach(user => {
    const userId = user[0]
    const friends = user[1]
    friends.forEach(f => {
      tgfArray.push(`${userId} ${f}\n`)
    })
  })

  return tgfArray.join("")
}

Promise.all([
  getCommonFollowers('_DanValencia', 'hackergil'),
  getCommonFriends('_DanValencia', 'hackergil')
]).then((friendsAndFollowersIds) => {
  return intersection(friendsAndFollowersIds[0], friendsAndFollowersIds[1])
}).then((commonFriendsAndFollowersIds) => {
  return buildGraph(commonFriendsAndFollowersIds)
}).then((friendGraph) => {
  const friendsIds = friendGraph.map(f => f[0])
  return TwitterClient.getScreenNamesForUsers(friendsIds.join(',')).then(users => {
    // return users.map(user => {return {id: user.id, name: user.screen_name}})
    return users.reduce((theMap, u) => {
      theMap[u.id] = u.screen_name;
      return theMap
    }, {})
  }).then(userScreenNameMap => {
    return {
      userScreenNameMap: userScreenNameMap,
      graph: friendGraph
    }
  })
}).then(graphObject => {
  console.log(convertToTGF(graphObject))
}).catch(reason => console.log(reason))
