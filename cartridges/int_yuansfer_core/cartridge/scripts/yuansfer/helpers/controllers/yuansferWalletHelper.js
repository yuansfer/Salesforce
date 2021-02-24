/* eslint-env es6 */
/* global request, customer */

'use strict';

/**
* Add New Card
*
* @returns {array} - array with result info
*/
function AddNewCard() {
    const yuansferPaymentMethodId = request.httpParameterMap.payment_method_id.stringValue;
    const yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
    const wallet = yuansferHelper.getYuansferWallet(customer);

    var responsePayload = {
        success: true
    };

    try {
        wallet.attachPaymentInstrument(yuansferPaymentMethodId);
    } catch (e) {
        responsePayload = {
            success: false,
            error: e.message
        };
    }

    return responsePayload;
}

module.exports.AddNewCard = AddNewCard;
module.exports.AddNewCard.public = true;

/**
* Make card default
*/
function MakeDefault() {
    const yuansferId = request.httpParameterMap.yuansfer_id.stringValue;
    const yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
    const wallet = yuansferHelper.getYuansferWallet(customer);

    try {
        wallet.makeDefault(yuansferId);
    } catch (e) {
        require('dw/system/Logger').error('Failed to make card default, original error was: {0}', e.message);
    }
}

module.exports.MakeDefault = MakeDefault;
module.exports.MakeDefault.public = true;

