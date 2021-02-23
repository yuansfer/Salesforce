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
    var data = yuansferHelper.getCkoTransactions();

    // Send the AJAX response
    // eslint-disable-next-line
    response.writer.println(JSON.stringify(data));
}

/**
 * Perform a remote Hub Call
 */
function remoteCall() {
    // Get the operating mode
    var mode = yuansferHelper.getValue('yuansferMode');

    // Get the transaction task
    // eslint-disable-next-line
    var task = request.httpParameterMap.get('task');

    // Get the transaction currency
    var currency = request.httpParameterMap.get('currency');

    // Get the transaction formated amount
    var formatedAmount = yuansferHelper.getFormattedPrice(request.httpParameterMap.get('amount').stringValue, currency);

    // Prepare the payload
    var gRequest = {
        // eslint-disable-next-line
        amount: formatedAmount, // eslint-disable-next-line
        chargeId: request.httpParameterMap.get('pid').stringValue, // eslint-disable-next-line
    };

    // Set the service parameter
    var serviceName = 'yuansfer.transaction.' + task + '.' + mode + '.service';

    // Log the payment request data
    yuansferHelper.log(
        yuansferHelper._('yuansfer.request.data', 'yuansfer') + ' - ' + serviceName,
        gRequest
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
