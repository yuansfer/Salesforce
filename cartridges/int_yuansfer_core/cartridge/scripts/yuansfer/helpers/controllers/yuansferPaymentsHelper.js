/* eslint-env es6 */
/* global request, dw, empty */

'use strict';

/**
 * Created a response payload for beforePaymentAuthorization based on the status
 * of a given payment intent.
 *
 * @param {Object} intent - PaymentIntent object
 * @return {Object} - Response payload to return to client
 */
function generateCardsPaymentResponse(intent) {
    const yuansferChargeCapture = dw.system.Site.getCurrent().getCustomPreferenceValue('yuansferChargeCapture');
    var responsePayload;
    if (intent.status === 'requires_capture' && !yuansferChargeCapture) {
        // The payment requires capture which will be made later
        responsePayload = {
            success: true
        };
    } else if (
        intent.status === 'requires_action' &&
        intent.next_action.type === 'use_yuansfer_sdk'
    ) {
        // Tell the client to handle the action
        responsePayload = {
            requires_action: true,
            payment_intent_client_secret: intent.client_secret
        };
    } else if (intent.status === 'succeeded') {
        // The payment didn’t need any additional actions and completed!
        // Handle post-payment fulfilment
        responsePayload = {
            success: true
        };
    } else {
        // Invalid status
        responsePayload = {
            error: 'Invalid PaymentIntent status'
        };
    }

    return responsePayload;
}

/**
 * Entry point for handling payment intent creation and confirmation AJAX calls.
 * @return {Object} responsePayload.
 */
function beforePaymentAuthorization() {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var responsePayload;

    try {
        var basket = BasketMgr.getCurrentBasket();
        if (basket) {
            var checkoutHelper = require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper');

            var yuansferPaymentInstrument = checkoutHelper.getYuansferPaymentInstrument(basket);

            if (yuansferPaymentInstrument && yuansferPaymentInstrument.paymentMethod === 'CREDIT_CARD') {
                var paymentIntent;
                var paymentIntentId = (yuansferPaymentInstrument.paymentTransaction) ?
                    yuansferPaymentInstrument.paymentTransaction.getTransactionID() : null;
                if (paymentIntentId) {
                    paymentIntent = checkoutHelper.confirmPaymentIntent(paymentIntentId);
                } else {
                    paymentIntent = checkoutHelper.createPaymentIntent(yuansferPaymentInstrument);

                    Transaction.wrap(function () {
                        yuansferPaymentInstrument.paymentTransaction.setTransactionID(paymentIntent.id);
                    });
                }

                if (paymentIntent.review) {
                    Transaction.wrap(function () {
                        basket.custom.yuansferIsPaymentIntentInReview = true;
                    });
                }

                responsePayload = generateCardsPaymentResponse(paymentIntent);
            } else if (yuansferPaymentInstrument && yuansferPaymentInstrument.paymentMethod === 'STRIPE_WECHATPAY') {
                Transaction.wrap(function () {
                    basket.custom.yuansferWeChatQRCodeURL = yuansferPaymentInstrument.custom.yuansferWeChatQRCodeURL;
                    basket.custom.yuansferIsPaymentIntentInReview = true;
                });

                responsePayload = {
                    success: true
                };
            } else {
                responsePayload = {
                    success: true
                };
            }
        }
    } catch (e) {
        if (e.callResult) {
            var o = JSON.parse(e.callResult.errorMessage);
            responsePayload = {
                error: {
                    code: o.error.code,
                    message: o.error.message
                }
            };
        } else {
            responsePayload = {
                error: {
                    message: e.message
                }
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
    const paramsMap = request.httpParameterMap;

    var redirectUrl = '';
    try {
        const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');

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
