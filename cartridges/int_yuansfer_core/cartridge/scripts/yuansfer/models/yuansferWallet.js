/* eslint-env es6 */

'use strict';

/**
 * Retrieves the Yuansfer customer ID from SFCC customer profile.
 *
 * @param {dw.customer.Customer} apiCustomer - Customer to retrieve the Yuansfer ID for.
 * @return {string} - Stripe customer ID or null if not set.
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
 * Saves Stripe customer ID with SFCC customer profile, thus linking the two.
 *
 * @param {dw.customer.Customer} apiCustomer - Customer to save the Stripe ID to.
 * @param {string} yuansferCustomerID - The ID of the customer on Stripe end
 */
function setyuansferCustomerID(apiCustomer, yuansferCustomerID) {
    if (apiCustomer.authenticated && apiCustomer.profile) {
        apiCustomer.profile.custom.yuansferCustomerID = yuansferCustomerID; // eslint-disable-line
    }
}

/**
 * Retrieves a list of payment instruments (Stripe Payment Methods or Sources)
 * attached to a Stripe customer. Default instrument is placed first.
 *
 * @param {string} yuansferCustomerID - ID of Stripe customer
 * @return {ArrayList<customerPaymentInstruments>} - Saved instruments attached
 * to a Stripe customer
 */
function fetchSavedPaymentInstruments(yuansferCustomerID) {
    const ArrayList = require('dw/util/ArrayList');
    const savedPaymentInstruments = new ArrayList();

    if (yuansferCustomerID) {
        try {
            const stripeService = require('*/cartridge/scripts/stripe/services/stripeService');

            const stripeCustomer = stripeService.customers.retrieve(yuansferCustomerID);
            const defaultPaymentMethodId = stripeCustomer.invoice_settings && stripeCustomer.invoice_settings.default_payment_method;
            const defaultSourceId = stripeCustomer.default_source;
            const defaultCardId = defaultPaymentMethodId || defaultSourceId;

            const stripePaymentInstrumentsResponse = stripeService.paymentMethods.list(yuansferCustomerID, 'card');
            const stripePaymentInstruments = stripePaymentInstrumentsResponse && stripePaymentInstrumentsResponse.data;

            if (stripePaymentInstruments && stripePaymentInstruments.length) {
                const CustomerPaymentInstrument = require('./customerPaymentInstrument');

                stripePaymentInstruments.forEach(function (stripePaymentMethod) {
                    const isDefault = stripePaymentMethod.id === defaultCardId;
                    const savedPaymentInstrument = new CustomerPaymentInstrument(stripePaymentMethod, isDefault);

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
 * Stripe saved cards.
 *
 * @constructor
 * @param {dw.customer.Customer} apiCustomer - SFCC API customer object to wrap
 */
function StripeWallet(apiCustomer) {
    var yuansferCustomerID = getyuansferCustomerID(apiCustomer);

    this.getPaymentInstruments = function () {
        return fetchSavedPaymentInstruments(yuansferCustomerID);
    };

    this.attachPaymentInstrument = function (stripePaymentMethodId) {
        if (!apiCustomer.authenticated) {
            throw new Error('Authenticated customer expected');
        }

        if (!stripePaymentMethodId) {
            throw new Error('Missing Stripe payment method ID');
        }

        const stripeService = require('*/cartridge/scripts/stripe/services/stripeService');

        try {
            let newStripeCustomer;
            if (!yuansferCustomerID) {
                newStripeCustomer = stripeService.customers.create({
                    email: apiCustomer.profile.email,
                    name: apiCustomer.profile.firstName + ' ' + apiCustomer.profile.lastName
                });

                yuansferCustomerID = newStripeCustomer.id;
            }

            if (!yuansferCustomerID) {
                throw new Error('Failed to get Stripe customer ID');
            }

            stripeService.paymentMethods.attach(stripePaymentMethodId, yuansferCustomerID);

            // In case a new Stripe customer was created and all good so far
            if (newStripeCustomer) {
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
        const stripeId = paymentInstrument && paymentInstrument.custom && paymentInstrument.custom.stripeId;

        if (yuansferCustomerID && stripeId) {
            const stripeService = require('*/cartridge/scripts/stripe/services/stripeService');

            try {
                stripeService.paymentMethods.detach(stripeId);
            } catch (e) {
                require('dw/system/Logger').error(e.message);
            }
        }
    };

    this.makeDefault = function (stripeId) {
        if (yuansferCustomerID && stripeId) {
            const stripeService = require('*/cartridge/scripts/stripe/services/stripeService');

            stripeService.customers.update(yuansferCustomerID, {
                invoice_settings: {
                    default_payment_method: stripeId
                }
            });
        }
    };
}

module.exports = function (apiCustomer) {
    return new StripeWallet(apiCustomer);
};
