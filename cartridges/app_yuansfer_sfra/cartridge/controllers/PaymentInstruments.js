/* global customer */

'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.append('List', function (req, res, next) {
    var yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
    if (yuansferHelper.isYuansferEnabled()) {
        var wallet = yuansferHelper.getYuansferWallet(customer);
        var paymentInstruments = wallet.getPaymentInstruments();
        res.setViewData({ paymentInstruments: paymentInstruments });
    }
    next();
});

module.exports = server.exports();
