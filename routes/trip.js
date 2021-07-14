const path = require('path');

const express = require('express');

const tripController = require('../controllers/trip');
const isAuth = require('../middlewares/is-auth');

const router = express.Router();

router.get('/', tripController.getIndex);

router.get('/trips/:tripId', tripController.getTrip);

module.exports = router;
