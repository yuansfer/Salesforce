/* eslint-env es6 */
/* eslint-disable no-plusplus */
/* global response */

'use strict';

// /* global request, response */

const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

exports.processIncomingNotification = function(params) {
    var json = params;
    try {
        var success = Transaction.wrap(function() {
            if (json == null || json.transactionNo == null) {
                return false;
            }
            var orderId = json.reference.split('-')[0];

            var order = OrderMgr.searchOrder('orderNo={0}', orderId);
            const Order = require('dw/order/Order');
            if (!order) {
                return false;
            }
            if (order.status.value === Order.ORDER_STATUS_CREATED) {
                OrderMgr.placeOrder(order);
            }
            order.custom.yuansferTransactionNo = json.transactionNo;
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            if (order.getCustomerEmail()) {
                COHelpers.sendConfirmationEmail(order, req.locale.id);
            }
            return true;
        });

        if (!success) {
            response.setStatus(500);
            return false;
        }
    } catch (e) {
        Logger.error(e);
        response.setStatus(500);
        return false;
    }

    response.setStatus(200);
    return true;
};
