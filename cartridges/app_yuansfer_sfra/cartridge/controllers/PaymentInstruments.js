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

server.prepend('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');
    var yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
    var wallet = yuansferHelper.getYuansferWallet(customer);

    if (!yuansferHelper.isYuansferEnabled()) {
        return next();
    }

    var data = res.getViewData();
    if (data && !data.loggedin) {
        res.json();
        this.emit('route:Complete', req, res);
        return null;
    }

    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
    var paymentToDelete = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    // Trigger SFRA payment delete if we receive actual payment instrument ID
    if (paymentToDelete) {
        return next();
    }

    wallet.removePaymentInstrument({ custom: { yuansferId: UUID } });

    res.json({ UUID: UUID });
    this.emit('route:Complete', req, res);
    return null;
});

module.exports = server.exports();
