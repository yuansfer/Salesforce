'use strict';

/* API Includes */
var ISML = require('dw/template/ISML');

/* Cheyuansferut.com Helper functions */
var yuansferHelper = require('~/cartridge/scripts/helpers/yuansferHelper');

/**
 * Get the transactions list
 */
function listTransactions() {
    // Render the template
    ISML.renderTemplate('transactions/list');
}

/**
 * Get the transactions table data
 */
function getTransactionsData() {
    // Prepare the output array
    var data = yuansferHelper.getYuansferTransactions();

    // Send the AJAX response
    // eslint-disable-next-line
    response.writer.println(JSON.stringify(data));
}

/**
 * Perform a remote Hub Call
 */
function remoteCall() {
    // Get the transaction currency
    var params = request.httpParameterMap.get('params');

    // Log the payment request data
    yuansferHelper.log(
        yuansferHelper._('yuansfer.request.data', 'yuansfer') + ' - ' + 'refund',
    );

    // Perform the request
    var gResponse = yuansferHelper.getGatewayClient(
        serviceName,
        gRequest
    );

    // Log the payment response data
    yuansferHelper.log(
        yuansferHelper._('yuansfer.response.data', 'yuansfer') + ' - ' + serviceName,
        gResponse
    );

    // Return the response
    // eslint-disable-next-line
    response.writer.println(JSON.stringify(gResponse));
}

/*
* Web exposed methods
*/

listTransactions.public = true;
getTransactionsData.public = true;
remoteCall.public = true;

exports.ListTransactions = listTransactions;
exports.GetTransactionsData = getTransactionsData;
exports.RemoteCall = remoteCall;
