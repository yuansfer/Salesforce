/* eslint-env es6 */
/* global */

'use strict';

/**
 * Decode parameter
 * @param {Object} params parameters
 * @return {Object} - decoded object
 */
function decodeFormParams(params) {
    var pairs = params.split('&');
    var result = {};

    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        var key = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]);
        var isArray = /\[\]$/.test(key);
        var dictMatch = key.match(/^(.+)\[([^\]]+)\]$/);

        if (dictMatch) {
            key = dictMatch[1];
            var subkey = dictMatch[2];

            result[key] = result[key] || {};
            result[key][subkey] = value;
        } else if (isArray) {
            key = key.substring(0, key.length - 2);
            result[key] = result[key] || [];
            result[key].push(value);
        } else {
            result[key] = value;
        }
    }

    return result;
}
exports.DecodeFormParams = decodeFormParams;

/**
 * Created a response payload for beforePaymentAuthorization based on the status
 * of a given payment params.
 *
 * @param {Object} params - PaymentIntent object
 * @return {Object} - Response payload to return to client
 */
function searchTransaction(params) {
    var responsePayload;
    const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');
    if (params) {
        responsePayload = yuansferService.tranQuery.create(params);
    }

    return responsePayload;
}

exports.SearchTransaction = searchTransaction;

/**
 * Entry point for handling payment creation and confirmation AJAX calls.
 * @param {Object} params - parameter object
 * @param {boolean} isMobile - device type
 * @return {Object} responsePayload.
 */
function beforePaymentAuthorization(params, isMobile) {

    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var responsePayload;
    var checkoutHelper = require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    try {
        var basket = BasketMgr.getCurrentBasket();
        if (basket) {

            var yuansferPaymentInstrument = checkoutHelper.getYuansferPaymentInstrument(basket);
            if (yuansferPaymentInstrument) {
                responsePayload = checkoutHelper.createSecurePay(params);
                Transaction.wrap(function() {
                    if (isMobile === 'true') {
                        basket.custom.isMobile = true;
                    } else {
                        basket.custom.isMobile = false;
                    }
                });
            }
        }
    } catch (e) {
        if (e.callResult) {
            var o = e.callResult;
            responsePayload = {
                error: {
                    message: o.status,
                },
            };
        } else {
            responsePayload = {
                error: {
                    message: e.message,
                },
            };
        }
    }

    return responsePayload;
}

exports.BeforePaymentAuthorization = beforePaymentAuthorization;
exports.BeforePaymentAuthorization.public = true;

/**
 * An entry point to handle returns from alternative payment methods.
 * @param {Object} sfra - .
 * @return {Object} redirectUrl.
 */
function handleAPM(sfra) {
    const URLUtils = require('dw/web/URLUtils');

    var redirectUrl = '';
    try {
        if (sfra) {
            redirectUrl = URLUtils.url('Checkout-Begin', 'stage', 'placeOrder');
        } else {
            redirectUrl = URLUtils.url('COSummary-Start');
        }
    } catch (e) {
        if (sfra) {
            redirectUrl = URLUtils.url('Checkout-Begin', 'stage', 'payment', 'apm_return_error', e.message);
        } else {
            redirectUrl = URLUtils.url('COBilling-Start', 'apm_return_error', e.message);
        }
    }

    return redirectUrl;
}
exports.HandleAPM = handleAPM;
exports.HandleAPM.public = true;

