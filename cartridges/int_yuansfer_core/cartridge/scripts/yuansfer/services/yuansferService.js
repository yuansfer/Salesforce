/* eslint-env es6 */

'use strict';

/* API Includes */
const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const yuansferWallet = require('../models/yuansferWallet');
const yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');

/**
 * Replaces credit card number (a number following card_number=) in a given
 * string with a masked version, keeping only the last 4 digits.
 *
 * @param {type} msg - The string in which to replace the card number.
 * @return {string} - The same string with only card number masked.
 */
function maskCardNumber(msg) {
    if (msg && msg.length) {
        const matches = msg.match(cardNumberRegex);

        if (matches && matches.length > 1) {
            const matched = matches[0];
            const toMask = matches[1];
            const masked = (new Array(toMask.length - 3)).join('*') + toMask.substr(-4);
            const stringToReplace = matched.replace(toMask, masked);
            return msg.replace(matched, stringToReplace);
        }
    }

    return msg;
}

const cvcRegex = /card.{1,6}cvc[^=]*=(\d*)/;

/**
 * Replaces CVC number (a number following card_cvc=) in a given
 * string with asterisks.
 *
 * @param {type} msg - The string in which to replace the cvc.
 * @return {string} - The same string with only cvc masked.
 */
function maskCVC(msg) {
    if (msg && msg.length) {
        const matches = msg.match(cvcRegex);

        if (matches && matches.length > 1) {
            const matched = matches[0];
            const toMask = matches[1];
            const masked = (new Array(toMask.length + 1)).join('*');
            const stringToReplace = matched.replace(toMask, masked);
            return msg.replace(matched, stringToReplace);
        }
    }

    return msg;
}

// Initialize Yuansfer
exports.init ={
    init: function(params){
        yuansfer.init(params);
    }
}

// https://mapi.yuansfer.com/online/v3/secure-pay
exports.securePay = {
    create: function (params) {
        yuansfer.securePay(params).then(res=>{
            return res;
        }).catch(res=>{
            return res;
        });
    },
};

// https://mapi.yuansfer.com/app-data-search/v3/refund
exports.refunds = {
    create: function (params) {
        yuansfer.refund(params);
    }
};
