const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tripSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  originLat: {
    type: String,
    required: true
  },
  originLng: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  destinationLat: {
    type: String,
    required: true
  },
  destinationLng: {
    type: String,
    required: true
  },
  plannedDate: {
    type: Date,
    required: false
  },
  weather: {
    type: JSON,
    required: true
  },
  levelOfIntensity: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: false
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Trip', tripSchema);

// const mongodb = require('mongodb');
// const getDb = require('../util/database').getDb;

// class Product {
//   constructor(title, imageUrl, description, price, id, userId) {
//     this.title = title;
//     this.imageUrl = imageUrl;
//     this.description = description;
//     this.price = price;
//     this._id = id ? new mongodb.ObjectId(id) : null;
//     this.userId = userId;
//   }

//   save() {
//     const db = getDb();
//     let dbOp;
//     if (this._id) {
//       dbOp = db
//       .collection('products')
//       .updateOne({_id: this._id}, {$set: this});
//     } else {
//       dbOp = db
//       .collection('products')
//       .insertOne(this);
//     }
//     return dbOp
//       .then(result => {
//         console.log(result);
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   }

//   static fetchAll() {
//     const db = getDb();
//     return db
//     .collection('products')
//     .find()
//     .toArray()
//     .then(products => {
//       //console.log(products);
//       return products;
//     })
//     .catch(err => {
//       console.log(err);
//     });
//   }

//   static findById(prodId) {
//     const db = getDb();
//     return db
//       .collection('products')
//       .find({_id: new mongodb.ObjectId(prodId)})
//       .next()
//       .then(product => {
//         console.log(product);
//         return product;
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   }

//   static deleteById(prodId) {
//     const db = getDb();
//     return db
//       .collection('products')
//       .deleteOne({_id: new mongodb.ObjectId(prodId)})
//       .then(result => {
//         console.log('Deleted');
//       })
//       .catch(err => {
//         console.log(err);
//       });
//   }


// };

// module.exports = Product;