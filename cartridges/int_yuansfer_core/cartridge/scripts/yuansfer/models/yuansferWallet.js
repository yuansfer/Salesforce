/* eslint-env es6 */

'use strict';

/**
 * Retrieves the Yuansfer customer ID from SFCC customer profile.
 *
 * @param {dw.customer.Customer} apiCustomer - Customer to retrieve the Yuansfer ID for.
 * @return {string} - Yuansfer customer ID or null if not set.
 */
function getyuansferCustomerID(apiCustomer) {
    if (apiCustomer.authenticated
        && apiCustomer.profile
        && 'yuansferCustomerID' in apiCustomer.profile.custom) {
        return apiCustomer.profile.custom.yuansferCustomerID;
    }

    return null;
}

/**
 * Saves Yuansfer customer ID with SFCC customer profile, thus linking the two.
 *
 * @param {dw.customer.Customer} apiCustomer - Customer to save the Yuansfer ID to.
 * @param {string} yuansferCustomerID - The ID of the customer on Yuansfer end
 */
function setYuansferCustomerID(apiCustomer, yuansferCustomerID) {
    if (apiCustomer.authenticated && apiCustomer.profile) {
        apiCustomer.profile.custom.yuansferCustomerID = yuansferCustomerID; // eslint-disable-line
    }
}

/**
 * Retrieves a list of payment instruments (Yuansfer Payment Methods or Sources)
 * attached to a Yuansfer customer. Default instrument is placed first.
 *
 * @param {string} yuansferCustomerID - ID of Yuansfer customer
 * @return {ArrayList<customerPaymentInstruments>} - Saved instruments attached
 * to a Yuansfer customer
 */
function fetchSavedPaymentInstruments(yuansferCustomerID) {
    const ArrayList = require('dw/util/ArrayList');
    const savedPaymentInstruments = new ArrayList();

    if (yuansferCustomerID) {
        try {
            const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');

            const yuansferCustomer = yuansferService.customers.retrieve(yuansferCustomerID);
            const defaultPaymentMethodId = yuansferCustomer.invoice_settings && yuansferCustomer.invoice_settings.default_payment_method;
            const defaultSourceId = yuansferCustomer.default_source;
            const defaultCardId = defaultPaymentMethodId || defaultSourceId;

            const yuansferPaymentInstrumentsResponse = yuansferService.paymentMethods.list(yuansferCustomerID, 'card');
            const yuansferPaymentInstruments = yuansferPaymentInstrumentsResponse && yuansferPaymentInstrumentsResponse.data;

            if (yuansferPaymentInstruments && yuansferPaymentInstruments.length) {
                const CustomerPaymentInstrument = require('./customerPaymentInstrument');

                yuansferPaymentInstruments.forEach(function (yuansferPaymentMethod) {
                    const isDefault = yuansferPaymentMethod.id === defaultCardId;
                    const savedPaymentInstrument = new CustomerPaymentInstrument(yuansferPaymentMethod, isDefault);

                    if (savedPaymentInstrument) {
                        savedPaymentInstruments[isDefault ? 'unshift' : 'add1'](savedPaymentInstrument);
                    }
                });
            }
        } catch (e) {
            require('dw/system/Logger').error(e.message);
            throw e;
        }
    }

    return savedPaymentInstruments;
}

/**
 * A wrapper for SFCC API customer object to provided functionality for managing
 * Yuansfer saved cards.
 *
 * @constructor
 * @param {dw.customer.Customer} apiCustomer - SFCC API customer object to wrap
 */
function YuansferWallet(apiCustomer) {
    var yuansferCustomerID = getyuansferCustomerID(apiCustomer);

    this.getPaymentInstruments = function () {
        return fetchSavedPaymentInstruments(yuansferCustomerID);
    };

    this.attachPaymentInstrument = function (yuansferPaymentMethodId) {
        if (!apiCustomer.authenticated) {
            throw new Error('Authenticated customer expected');
        }

        if (!yuansferPaymentMethodId) {
            throw new Error('Missing Yuansfer payment method ID');
        }

        const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');

        try {
            let newYuansferCustomer;
            if (!yuansferCustomerID) {
                newYuansferCustomer = yuansferService.customers.create({
                    email: apiCustomer.profile.email,
                    name: apiCustomer.profile.firstName + ' ' + apiCustomer.profile.lastName
                });

                yuansferCustomerID = newYuansferCustomer.id;
            }

            if (!yuansferCustomerID) {
                throw new Error('Failed to get Yuansfer customer ID');
            }

            yuansferService.paymentMethods.attach(yuansferPaymentMethodId, yuansferCustomerID);

            // In case a new Yuansfer customer was created and all good so far
            if (newYuansferCustomer) {
                require('dw/system/Transaction').wrap(function () {
                    setyuansferCustomerID(apiCustomer, yuansferCustomerID);
                });
            }
        } catch (e) {
            require('dw/system/Logger').error(e.message);
            throw e;
        }
    };

    this.removePaymentInstrument = function (paymentInstrument) {
        const yuansferId = paymentInstrument && paymentInstrument.custom && paymentInstrument.custom.yuansferId;

        if (yuansferCustomerID && yuansferId) {
            const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');

            try {
                yuansferService.paymentMethods.detach(yuansferId);
            } catch (e) {
                require('dw/system/Logger').error(e.message);
            }
        }
    };

    this.makeDefault = function (yuansferId) {
        if (yuansferCustomerID && yuansferId) {
            const yuansferService = require('*/cartridge/scripts/yuansfer/services/yuansferService');

            yuansferService.customers.update(yuansferCustomerID, {
                invoice_settings: {
                    default_payment_method: yuansferId
                }
            });
        }
    };
}

module.exports = function (apiCustomer) {
    return new YuansferWallet(apiCustomer);
};
