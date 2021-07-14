const { validationResult } = require('express-validator/check');
require('dotenv').config();
const Trip = require('../models/trip');
const fetch = require('node-fetch');

exports.getAddTrip = (req, res, next) => {
  res.render('user/edit-trip', {
    pageTitle: 'Add Trip',
    path: '/user/add-trip',
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
      return res.status(422).render('user/edit-product', {
        pageTitle: 'Add Trip',
        path: '/user/edit-trip',
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
      res.redirect('/user/trips');
    })
    // .then(
    //   Trip.find({ userId: req.user._id })
    //   .then(trips => {
    //     console.log(trips);
    //     res.redirect('user/trips', {
    //       trips: trips,
    //       pageTitle: 'user Trips',
    //       path: '/user/trips'
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
      res.render('user/edit-trip', {
        pageTitle: 'Edit Trip',
        path: '/user/edit-trip',
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
      return res.status(422).render('user/edit-trip', {
        pageTitle: 'Edit Trip',
        path: '/user/edit-trip',
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
        // trip.originLat = originLat;
        // trip.originLng = originLng;
        // trip.destinationLat = destinationLat;
        // trip.destinationLng = destinationLng;
        trip.description = description;
        trip.plannedDate = plannedDate;
        trip.weather = weatherData;
        trip.levelOfIntensity = levelOfIntensity;
        trip.imageUrl = imageUrl;
        return trip.save().then(result => {
          console.log('UPDATED TRIP!');
          res.redirect('/user/trips');
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
        if (trip.weather.current == undefined || (time - (trip.weather.current.dt * 1000) > 86400)) {
          this.getWeatherData(trip.destinationLat, trip.destinationLng)
            .then(weather => {
              trip.weather = weather;
              trip.save();
            });
        }
      }
      res.render('user/my-trips', {
        trips: trips,
        getWeatherIcon: this.getWeatherIcon,
        pageTitle: 'My Trips',
        path: '/user/my-trips'
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
      res.redirect('/user/trip-started');
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
      res.redirect('/user/my-trips');
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

exports.getTrip = (req, res, next) => {
  const tripId = req.params.tripId;
  Trip.findById(tripId)
    .then(trip => {
      res.render('user/trip-detail', {
        trip: trip,
        getWeatherIcon: this.getWeatherIcon,
        pageTitle: trip.name,
        path: '/user/my-trips'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getWeatherIcon = (description) => {
  if (description.includes("clear")) { 
    return "sun";
  } else if (description.includes("few clouds")) { 
    return "cloud-sun";
  } else if (description.includes("clouds")) { 
    return "cloud";
  } else if (description.includes("thunderstorm")) { 
    return "bolt";
  } else if (description.includes("freezing")) { 
    return "temperature-low";
  } else if (description.includes("snow") || description.includes("sleet") || description.includes("hail")) { 
    return "snowflake";
  } else if (description.includes("drizzle") || description.includes("rain")) { 
      if (description.includes("light")) { 
        return "cloud-rain";
      } else { 
        return "cloud-showers-heavy";
      } 
  } 
}