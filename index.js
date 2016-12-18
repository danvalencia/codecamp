const Twitter = require('twitter');
const env = require('node-env-file');

env('.env');

const client = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_KEY,
  access_token_secret: process.env.ACCESS_SECRET
})

var params = {screen_name: 'nodejs'};


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

const getScreenNamesForUsers = (user, userIds) => {
  console.log(userIds)
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

const getCommonFollowers = (user1, user2) => {
  const p1 = getFollowersIdsForUser(user1) // [1,2,3,4,5]
  const p2 = getFollowersIdsForUser(user2)// [2,3,5]
  const commonFollowers = []
  return Promise.all([p1, p2]).then((followerIds) => {
    const sortedFollowerIds = followerIds.reduce((a,b) => a.concat(b), []).sort()

    console.log("Sorted follower ids")
    console.log(sortedFollowerIds)

    sortedFollowerIds.reduce((a,b) => {
      if (a === b) {
        commonFollowers.push(a)
      }
      return b
    })

    return new Promise(resolve => resolve(commonFollowers))
  })
}

getCommonFollowers('_DanValencia', 'hackergil')
.then(commonFollowerIds => {
  return getScreenNameForAllUsers(commonFollowerIds)
})
.then(commonFollowers => {
  const screenNameArray = commonFollowers.reduce((a,b) => a.concat(b), []).map(user => user.screen_name)
  console.log("Common screen names")
  console.log(screenNameArray)
})
.catch(reason => console.log(reason))

// getFollowersIdsForUser("_DanValencia")
// .then((followerIds) => {
//   return getScreenNameForAllUsers(followerIds)
// })
// .then((screenNames) => {
//   console.log("Screen names are:")
//   console.log(screenNameArray)
// })
// .catch((reason) => {
//   console.log('Error occurred because of:')
//   console.log(reason)
// })
