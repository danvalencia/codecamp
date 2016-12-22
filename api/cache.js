const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

// Connection URL

class CacheManager {

  constructor(db) {
    this.url = `mongodb://localhost:27017/${db}`
  }

  executeWithinDocument(document, block) {
    return new Promise((resolve, reject) => {
      MongoClient.connect(this.url, (err, db) => {
        var collection = db.collection(document)
        block(collection).then(result => {
          resolve(result)
        }).catch(error => {
          reject(error)
        })
        db.close()
      })
    })
  }

  get(document, key) {
    return this.executeWithinDocument(document, (collection) => {
      return new Promise((resolve, reject) => {
        collection.find({key: key}).limit(1).toArray((err, docs) => {
          if (err) {
            reject(err)
          } else {
            resolve(docs)
          }
        })
      })
    })
  }

  put(document, key, value) {
    return this.executeWithinDocument(document, (collection) => {
      return new Promise((resolve, reject) => {
        collection.insertOne({key: key, value: value}, (err, r) => {
          if (err) {
            reject(err)
          } else {
            resolve(r)
          }
        })
      })
    })
  }
}

module.exports = CacheManager
