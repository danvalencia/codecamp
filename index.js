const Twitter = require('twitter');
const env = require('node-env-file');

env('.env');

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_KEY,
  access_token_secret: process.env.ACCESS_SECRET
})

const getFollowersIdsForUser = (user) => {
  const params = {
    screen_name: user
  }

  return new Promise((resolve, reject) => {
    client.get('followers/ids', params, (error, followerIds, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(followerIds.ids)
      }
    })
  })
}

const getFriendIdsForUser = (user) => {
  const params = {
    screen_name: user
  }

  return new Promise((resolve, reject) => {
    client.get('friends/ids', params, (error, friendIds, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(friendIds.ids)
      }
    })
  })
}

const getScreenNamesForUsers = (user, userIds) => {
  const params = {
    user_id: userIds
  }

  return new Promise((resolve, reject) => {
    client.get('users/lookup', params, (error, users, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(users)
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
    promiseArray.push(getScreenNamesForUsers(null, ids.join(',')))
  }
  return Promise.all(promiseArray)
}

const getCommonIds = (ids) => {
  const sortedFollowerIds = ids.sort()
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
    return getCommonIds(followerIds.reduce((a,b) => a.concat(b), []))
  })
}

const getCommonFriends = (user1, user2) => {
  return Promise.all([
    getFriendIdsForUser(user1),
    getFriendIdsForUser(user2)
  ]).then((friendIds) => {
    return getCommonIds(friendIds.reduce((a,b) => a.concat(b), []))
  })
}

Promise.all([
  getCommonFollowers('_DanValencia', 'hackergil'),
  getCommonFriends('_DanValencia', 'hackergil')
]).then((friendsAndFollowersIds) => {
  return getCommonIds(friendsAndFollowersIds.reduce((a,b) => a.concat(b), []))
}).then((commonFriendsAndFollowersIds) => {
  return getScreenNameForAllUsers(commonFriendsAndFollowersIds)
}).then((commonFriendsAndFollowers) => {
  const commonFriendsScreenNames = commonFriendsAndFollowers[0].map(u => u.screen_name)
  console.log(commonFriendsScreenNames)
}).catch(reason => console.log(reason))
