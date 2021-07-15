/* eslint-env es6 */

'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.prepend('PlaceOrder', server.middleware.https, function(req, res, next) {
    var yuansferHelper = require('*/cartridge/scripts/yuansfer/helpers/yuansferHelper');
    if (!yuansferHelper.isYuansferEnabled()) {
        return next();
    }
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var collections = require('*/cartridge/scripts/util/collections');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    const Order = require('dw/order/Order');
    var isYuansfer = false;
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString(),
        });
        return next();
    }
    collections.forEach(currentBasket.getPaymentInstruments(), function(paymentInstrument) {
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

        if (paymentProcessor.ID === 'YUANSFER_APM' || paymentProcessor.ID === 'YUANSFER_CREDIT') {
            isYuansfer = true;
        }
    });

    if (!isYuansfer) {
        return next();
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString(),
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address',
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null),
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress',
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null),
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    // Calculate the basket
    Transaction.wrap(function() {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument',
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null),
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null),
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    // Yuansfer changes BEGIN
    const yuansferCheckoutHelper = require('*/cartridge/scripts/yuansfer/helpers/checkoutHelper');
    var order = yuansferCheckoutHelper.createOrder(currentBasket);
    // Yuansfer changes END
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null),
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null),
        });
        this.emit('route:Complete', req, res);
        return null;
    }

    // Yuansfer changes BEGIN
    var isAPMOrder = yuansferCheckoutHelper.isAPMOrder(order);
    if (!isAPMOrder) {
        var yuansferPaymentInstrument = yuansferCheckoutHelper.getYuansferPaymentInstrument(order);
        // Places the order
        var placeOrderResult = COHelpers.placeOrder(order);
        if (placeOrderResult.error) {
            yuansferCheckoutHelper.refundCharge(order);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null),
            });
            this.emit('route:Complete', req, res);
            return null;
        }

        COHelpers.sendConfirmationEmail(order, req.locale.id);

        // Reset usingMultiShip after successful Order placement
        req.session.privacyCache.set('usingMultiShipping', false);

        res.json({
            error: false,
            orderID: order.orderNo,
            orderToken: order.orderToken,
            continueUrl: URLUtils.url('Order-Confirm').toString(),
        });

        this.emit('route:Complete', req, res);
        return null;
    }

    var confirmPaymentHelper = require('*/cartridge/scripts/yuansfer/helpers/confirmPaymentHelper');
    var json = {reference:order.orderNo,transactionNo: currentBasket.custom.yuansferTransactionNo}

    Transaction.wrap(function() {

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
    });
    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString(),
    });
    this.emit('route:Complete', req, res);
    return null;
    // Yuansfer changes END
});

module.exports = server.exports();
