const fetch = require('node-fetch');
require('dotenv').config();

const Trip = require('../models/trip');
const { callbackPromise } = require('nodemailer/lib/shared');

exports.getMap = (req, res, next) => {
  return res.render('shop/map', {
    api_key: process.env.GOOGLE_MAPS_API_KEY,
    pageTitle: 'Map Page',
    path: '/map'
  });
};

exports.getTrip = (req, res, next) => {
  const tripId = req.params.tripId;
  Trip.findById(tripId)
    .then(trip => {
      res.render('trip/trip-detail', {
        trip: trip,
        getWeatherIcon: this.getWeatherIcon,
        pageTitle: trip.name,
        path: '/trips'
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

exports.getIndex = (req, res, next) => {
  Trip.find()
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
      res.render('trip/index', {
        trips: trips,
        getWeatherIcon: this.getWeatherIcon,
        pageTitle: 'Trips',
        path: '/'
      });
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
