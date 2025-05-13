const express = require('express');
const router = express.Router();
const orderController = require('./Xorders');

// User routes
router.post('/create',  orderController.createOrder);
router.get('/user',  orderController.getUserOrders);
router.post('/verify001', orderController.verifyPayment);
router.get('/:id',  orderController.getOrderById);
router.put('/:id/cancel',  orderController.cancelOrder);
// Admin routes
router.get('/admin/all', orderController.getAllOrders);
router.put('/admin/:id', orderController.updateOrder);
router.delete('/admin/:id', orderController.deleteOrder);
router.get('/admin/charts', orderController.getOrderChartsData);

module.exports = router;