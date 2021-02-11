/* eslint-env es6 */

'use strict';

/**
 * @type {dw.template.ISML}
 */
const ISML = require('dw/template/ISML');

/**
 * Load Yuansfer js lib
 */
function htmlHead() {
    ISML.renderTemplate('loadYuansfer');
}

exports.htmlHead = htmlHead;
