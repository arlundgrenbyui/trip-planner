const path = require('path');

const express = require('express');
const { body } = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middlewares/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

router.get('/add-trip', isAuth, adminController.getAddTrip);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

router.get('/trips', isAuth, adminController.getTrips);

// /admin/add-product => POST
router.post(
  '/add-product',
  [
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('imageUrl').isURL(),
    body('price').isFloat(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  isAuth,
  adminController.postAddProduct
);

router.post(
  '/add-trip',
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
  adminController.postAddTrip
);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.get('/edit-trip/:tripId', isAuth, adminController.getEditTrip);

router.post(
  '/edit-product',
  [
    body('title')
      .isString()
      .isLength({ min: 3 })
      .trim(),
    body('imageUrl').isURL(),
    body('price').isFloat(),
    body('description')
      .isLength({ min: 5, max: 400 })
      .trim()
  ],
  isAuth,
  adminController.postEditProduct
);

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
  adminController.postEditTrip
);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

router.post('/delete-trip', isAuth, adminController.postDeleteTrip);

module.exports = router;
