const fetch = require('node-fetch');
require('dotenv').config();
const Product = require('../models/product');
const Order = require('../models/order');

const Trip = require('../models/trip');
const { callbackPromise } = require('nodemailer/lib/shared');

exports.getMap = (req, res, next) => {
  return res.render('shop/map', {
    api_key: process.env.GOOGLE_MAPS_API_KEY,
    pageTitle: 'Map Page',
    path: '/map'
  });
};

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      // console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'Products',
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getTrips = (req, res, next) => {
  Trip.find()
    .then(trips => {
      // console.log(products);
      res.render('shop/product-list', {
        prods: trips,
        pageTitle: 'Trips',
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getTrip = (req, res, next) => {
  const tripId = req.params.tripId;
  Trip.findById(tripId)
    .then(trip => {
      res.render('shop/product-detail', {
        product: trip,
        pageTitle: trip.name,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Home Page',
        path: '/'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// Rename this to getIndex when it is fully refactored
exports.getTripIndex = (req, res, next) => {
  Trip.find()
    .then(trips => {
      res.render('shop/index', {
        prods: trips,
        pageTitle: 'Home Page',
        path: '/'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      let price = 0;
      if (products.length) {
        price = products.map(i => {
          return i.price * i.quantity;
        }).reduce((total, p) => {
          return total + p;
        });
      }
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products,
        price: price
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.getTripList = (req, res, next) => {
  req.user
    .populate('tripList.trips.tripId')
    .execPopulate()
    .then(user => {
      const trips = user.trips.places;
      // let price = 0;
      // if (products.length) {
      //   price = products.map(i => {
      //     return i.price * i.quantity;
      //   }).reduce((total, p) => {
      //     return total + p;
      //   });
      // }
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Trips',
        products: trips,
        price: price
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};


exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToTrips(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postTripList = (req, res, next) => {
  const tripId = req.body.tripId;
  Trip.findById(tripId)
    .then(trip => {
      return req.user.addToTrips(trip);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromTrips(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postTripListDeleteTrip = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromTrips(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc }, price: i.price };
      });
      const price = user.cart.items.map(i => {
        return i.price * i.quantity;
      }).reduce((total, p) => {
        return total + p;
      });
      const order = new Order({
        user: {
          name: req.user.name,
          email: req.user.email,
          userId: req.user
        },
        products: products,
        price: price
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearTrips();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getWeatherData = (req, res, next) => {
  const lat = req.body.lat;
  const lon = req.body.lon;
  const api = process.env.OPENWEATHERMAP_API_KEY;
  fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${api}`)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      return data;
    })
};