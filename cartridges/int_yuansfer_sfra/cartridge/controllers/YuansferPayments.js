/* eslint-disable new-cap */

'use strict';

var server = require('server');

var yuansferPaymentsHelper = require('*/cartridge/scripts/yuansfer/helpers/controllers/yuansferPaymentsHelper');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Entry point for handling payment intent creation and confirmation AJAX calls.
 */
server.post('BeforePaymentAuthorization', server.middleware.https, csrfProtection.validateAjaxRequest, function(req, res, next) {

    var params = JSON.parse(req.httpHeaders.params);
    var isMobile = req.httpHeaders.ismobile;
    var responsePayload = null;
    var response = yuansferPaymentsHelper.BeforePaymentAuthorization(params, isMobile);
    if (response) {
        responsePayload = response;
    } else {
        responsePayload = {
            error: true,
        };
    }
    res.json(responsePayload);
    next();
});

/**
 * Entry point for handling transaction search.
 */
server.post('TransactionQuery', function(req, res, next) {
    var bodyParams = req.httpParameterMap.requestBodyAsString;
    var params = yuansferPaymentsHelper.DecodeFormParams(bodyParams);
    var responsePayload = yuansferPaymentsHelper.SearchTransaction(params);

    if (responsePayload.ret_code == '000100' && responsePayload.result.status === 'success') {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function() {
            currentBasket.custom.yuansferTransactionNo = responsePayload.result.transactionNo;
        });
    }
    res.json(responsePayload);
    next();
});

/**
 * An entry point to handle returns from alternative payment methods.
 */

server.get('HandleAPM', function(req, res, next) {
    var redirectUrl = yuansferPaymentsHelper.HandleAPM(true);
    res.redirect(redirectUrl);
    next();
});

module.exports = server.exports();
