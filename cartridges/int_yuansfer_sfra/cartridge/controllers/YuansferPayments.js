/* eslint-disable new-cap */

'use strict';

var server = require('server');

var yuansferPaymentsHelper = require('*/cartridge/scripts/yuansfer/helpers/controllers/yuansferPaymentsHelper');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Entry point for handling payment intent creation and confirmation AJAX calls.
 */
server.post('BeforePaymentAuthorization', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var responsePayload = yuansferPaymentsHelper.BeforePaymentAuthorization(req);
    res.json(responsePayload);
    next();
});

/**
 * An entry point to handle returns from alternative payment methods.
 */

server.get('HandleAPM', function (req, res, next) {
    var redirectUrl = yuansferPaymentsHelper.HandleAPM(true);
    res.redirect(redirectUrl);
    next();
});

/**
 * Get Yuansfer Order Items
 */
server.get('GetYuansferOrderItems', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();

    var yuansferOrderDetails = basket ? require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper').getYuansferOrderDetails(basket) : null;

    res.json({
        amount: yuansferOrderDetails ? yuansferOrderDetails.amount : [],
        orderItems: yuansferOrderDetails ? yuansferOrderDetails.order_items : []
    });

    next();
});

module.exports = server.exports();
