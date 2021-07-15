/* eslint-env es6 */
/* global request */

'use strict';

var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');

/**
* Handle alternative payment
*
* @param {array} args with paramenters
* @returns {array} - array with result info
*/
function Handle(args) {
    const checkoutHelper = require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper');
    const paramsMap = request.httpParameterMap;
    const selectedPaymentMethodID = paramsMap.dwfrm_billing_paymentMethods_selectedPaymentMethodID.stringValue || paramsMap.dwfrm_billing_paymentMethod.stringValue;// app.getForm('billing').object.paymentMethods.selectedPaymentMethodID.value;
    const params = {};

    try {
        Transaction.begin();
        checkoutHelper.createYuansferPaymentInstrument(args.Basket, selectedPaymentMethodID, params);
        Transaction.commit();
        return {
            success: true,
        };
    } catch (e) {
        Transaction.rollback();
        return {
            success: false,
            error: true,
            errorMessage: e.message,
        };
    }
}

/**
* Authorize alternative payment
*
* @param {array} args with paramenters
* @returns {Object} - object with result info
*/
function Authorize(args) {
    const paymentInstrument = args.PaymentInstrument;
    const paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function() {
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    return {
        authorized: true,
        error: false,
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
