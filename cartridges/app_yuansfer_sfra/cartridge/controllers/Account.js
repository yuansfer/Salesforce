/* global customer */

'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.append('Show', function (req, res, next) {
    var yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
    if (yuansferHelper.isYuansferEnabled()) {
        var wallet = yuansferHelper.getYuansferWallet(customer);
        var paymentInstruments = wallet.getPaymentInstruments();
        var viewData = res.getViewData();
        if (paymentInstruments && paymentInstruments.length > 0) {
            viewData.account.payment = paymentInstruments[0];
        }

        res.setViewData(viewData);
    }
    next();
});

module.exports = server.exports();
