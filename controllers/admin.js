const { validationResult } = require('express-validator/check');
require('dotenv').config();
const Product = require('../models/product');
const Trip = require('../models/trip');
const fetch = require('node-fetch');

exports.getAddTrip = (req, res, next) => {
  res.render('admin/edit-trip', {
    pageTitle: 'Add Trip',
    path: '/admin/add-trip',
    editing: false,
    hasError: false,
    errorMessage: null,
    api_key: process.env.GOOGLE_MAPS_API_KEY,
    validationErrors: []
  });
};

exports.postAddTrip = (req, res, next) => {
  console.log(req.body);
  const name = req.body.name;
  const imageUrl = req.body.imageUrl;
  const origin = req.body.origin;
  const destination = req.body.destination;
  const originLat = req.body.origLat;
  const originLng = req.body.origLng;
  const destinationLat = req.body.destLat;
  const destinationLng = req.body.destLng;
  const description = req.body.description;
  const plannedDate = req.body.plannedDate;
  const levelOfIntensity = req.body.levelOfIntensity;
  const errors = validationResult(req);

  this.getWeatherData(destinationLat, destinationLng).then(weatherData => {
    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(422).render('admin/edit-product', {
        pageTitle: 'Add Trip',
        path: '/admin/edit-trip',
        editing: false,
        hasError: true,
        trip: {
          name: name,
          origin: origin,
          destination: destination,
          originLat: originLat,
          originLng: originLng,
          destinationLat: destinationLat,
          destinationLng: destinationLng,
          description: description,
          plannedDate: plannedDate,
          weather: weatherData,
          levelOfIntensity: levelOfIntensity,
          imageUrl: imageUrl
        },
        api_key: process.env.GOOGLE_MAPS_API_KEY,
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array()
      });
    }

    const trip = new Trip({
      name: name,
      origin: origin,
      destination: destination,
      originLat: originLat,
      originLng: originLng,
      destinationLat: destinationLat,
      destinationLng: destinationLng,
      description: description,
      plannedDate: plannedDate,
      weather: weatherData,
      levelOfIntensity: levelOfIntensity,
      imageUrl: imageUrl,
      userId: req.user
    });

    trip
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Trip');
      res.redirect('/admin/trips');
    })
    // .then(
    //   Trip.find({ userId: req.user._id })
    //   .then(trips => {
    //     console.log(trips);
    //     res.redirect('admin/trips', {
    //       trips: trips,
    //       pageTitle: 'Admin Trips',
    //       path: '/admin/trips'
    //     });
    //   })
    //   .catch(err => {
    //     const error = new Error(err);
    //     error.httpStatusCode = 500;
    //     return next(error);
    //   })
    // )
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });

  });
};

exports.getEditTrip = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const tripId = req.params.tripId;
  Trip.findById(tripId)
    .then(trip => {
      if (!trip) {
        return res.redirect('/');
      }
      res.render('admin/edit-trip', {
        pageTitle: 'Edit Trip',
        path: '/admin/edit-trip',
        editing: editMode,
        trip: trip,
        api_key: process.env.GOOGLE_MAPS_API_KEY,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditTrip = (req, res, next) => {
  const tripId = req.body.tripId;
  const name = req.body.name;
  const imageUrl = req.body.imageUrl;
  const origin = req.body.origin;
  const destination = req.body.destination;
  const originLat = req.body.origLat;
  const originLng = req.body.origLng;
  const destinationLat = req.body.destLat;
  const destinationLng = req.body.destLng;
  const description = req.body.description;
  const plannedDate = req.body.plannedDate;
  const levelOfIntensity = req.body.levelOfIntensity;
  const errors = validationResult(req);

  this.getWeatherData(destinationLat, destinationLng).then(weatherData => {
    if (!errors.isEmpty()) {
      return res.status(422).render('admin/edit-trip', {
        pageTitle: 'Edit Trip',
        path: '/admin/edit-trip',
        editing: true,
        api_key: process.env.GOOGLE_MAPS_API_KEY,
        hasError: true,
        trip: {
          name: name,
          origin: origin,
          destination: destination,
          originLat: originLat,
          originLng: originLng,
          destinationLat: destinationLat,
          destinationLng: destinationLng,
          description: description,
          plannedDate: plannedDate,
          weather: weatherData,
          levelOfIntensity: levelOfIntensity,
          imageUrl: imageUrl,
          _id: tripId
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array()
      });
    }

    Trip.findById(tripId)
      .then(trip => {
        if (trip.userId.toString() !== req.user._id.toString()) {
          return res.redirect('/');
        }
        trip.name = name;
        trip.origin = origin;
        trip.destination = destination;
        trip.originLat = originLat;
        trip.originLng = originLng;
        trip.destinationLat = destinationLat;
        trip.destinationLng = destinationLng;
        trip.description = description;
        trip.plannedDate = plannedDate;
        trip.weather = weatherData;
        trip.levelOfIntensity = levelOfIntensity;
        trip.imageUrl = imageUrl;
        return trip.save().then(result => {
          console.log('UPDATED TRIP!');
          res.redirect('/admin/trips');
        });
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
};

exports.getTrips = (req, res, next) => {
  Trip.find({ userId: req.user._id })
    .then(trips => {
      const time = new Date().getTime();
      for (let trip of trips) {
        if (trip.weather.current == undefined || (time - trip.weather.current.dt > 86400)) {
          this.getWeatherData(trip.destinationLat, trip.destinationLng)
            .then(weather => {
              trip.weather = weather;
              trip.save();
            });
        }
      }
      res.render('admin/trips', {
        trips: trips,
        pageTitle: 'Admin Trips',
        path: '/admin/trips'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postStartTrip = (req,res,next) => {
  Trip.findById(req.body.tripId)
    .then(trip => {
      if (trip.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      res.redirect('/admin/trip-started');
      return transporter.sendMail({
        to: email,
        from: 'Kyle Mueller<kyle.mueller.ghs@gmail.com>',
        subject: 'Account Created Successfully!',
        html: `<h1>Congrats on starting your trip!</h1>\n<p>Click here to begin your adventure: 
        https://www.google.com/maps/dir/?api=1&origin=${trip.originLat},${trip.originLng}&destination=${trip.destinationLat},${trip.destinationLng}</p>`
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
}

exports.postDeleteTrip = (req, res, next) => {
  const tripId = req.body.tripId;
  Trip.deleteOne({ _id: tripId, userId: req.user._id })
    .then(() => {
      console.log('DESTROYED TRIP');
      res.redirect('/admin/trips');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getWeatherData = (lat, lng) => {
  const api = process.env.OPENWEATHERMAP_API_KEY;
  return fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&units=imperial&appid=${api}`)
    .then(response => response.json())
    .then(data => {
      return data;
    });
};

exports.getRecommendations = () => {
  return "clothes and water";
};





























exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    api_key: process.env.GOOGLE_MAPS_API_KEY,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const origin = req.body.origin;
  const destination = req.body.destination;
  const description = req.body.description;
  const errors = validationResult(req);

  console.log(origin);
  console.log(destination);

  if (!errors.isEmpty()) {
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        imageUrl: imageUrl,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        api_key: process.env.GOOGLE_MAPS_API_KEY,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      api_key: process.env.GOOGLE_MAPS_API_KEY,
      hasError: true,
      product: {
        title: updatedTitle,
        imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  Product.findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.imageUrl = updatedImageUrl;
      return product.save().then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then(products => {
      // console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.deleteOne({ _id: prodId, userId: req.user._id })
    .then(() => {
      console.log('DESTROYED PRODUCT');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};