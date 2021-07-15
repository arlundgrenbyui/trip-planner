const path = require('path');

const express = require('express');
const { body } = require('express-validator/check');

const userController = require('../controllers/user');
const isAuth = require('../middlewares/is-auth');

const router = express.Router();

router.get('/add-trip', isAuth, userController.getAddTrip);

router.get('/my-trips', isAuth, userController.getTrips);

router.get('/my-trips/:tripId', userController.getTrip);

router.get('/start/:tripId', userController.getStartTrip);

router.post(
  '/add-trip',
  [
    body('name')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('origLng')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('imageUrl').isURL(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  isAuth,
  userController.postAddTrip
);

router.get('/edit-trip/:tripId', isAuth, userController.getEditTrip);

router.post(
  '/edit-trip',
  [
    body('name')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('imageUrl').isURL(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  isAuth,
  userController.postEditTrip
);

router.post('/delete-trip', isAuth, userController.postDeleteTrip);

module.exports = router;
