/* eslint-disable no-console */
/* eslint-disable no-alert */
/* globals yuansfer */
// v3

var paymentMethodOptions = document.querySelectorAll('input[name$="_selectedPaymentMethodID"]');

var newCardFormContainer = document.getElementById('new-card-form-container');
var cardIdInput = document.getElementById('yuansfer_source_id');
var cardNumberInput = document.getElementById('yuansfer_card_number');
var cardHolderInput = document.getElementById('yuansfer_card_holder');
var cardTypeInput = document.getElementById('yuansfer_card_type');
var cardBrandInput = document.getElementById('yuansfer_card_brand');
var cardExpMonthInput = document.getElementById('yuansfer_card_expiration_month');
var cardExpYearInput = document.getElementById('yuansfer_card_expiration_year');

var placeOrderButton = document.querySelector('button[name=submit]');
var forceSubmit = false;
function getSelectedPaymentMethod() {
    for (var i = 0; i < paymentMethodOptions.length; i++) {
        var paymentMethodOption = paymentMethodOptions[i];
        if (paymentMethodOption.checked) {
            return paymentMethodOption.value;
        }
    }

    return null;
}

function isSavedCard() {
    return newCardFormContainer && newCardFormContainer.style.display === 'none';
}

function copySelectedSaveCardDetails() {
    var savedCards = document.querySelectorAll('input[name=saved_card_id]');

    for (var i = 0; i < savedCards.length; i++) {
        var savedCard = savedCards[i];
        if (savedCard.checked) {
            cardIdInput.value = savedCard.value;
            cardNumberInput.value = savedCard.dataset.cardnumber;
            cardHolderInput.value = savedCard.dataset.cardholder;
            cardTypeInput.value = savedCard.dataset.cardtype;
            cardExpMonthInput.value = savedCard.dataset.cardexpmonth;
            cardExpYearInput.value = savedCard.dataset.cardexpyear;
            prUsedInput.value = '';

            return true;
        }
    }

    return false;
}

function copyNewCardDetails(paymentMethod) {
    cardIdInput.value = paymentMethod.id;

    if (paymentMethod.card) {
        cardNumberInput.value = '************' + paymentMethod.card.last4;
        cardTypeInput.value = '';
        cardBrandInput.value = paymentMethod.card.brand;
        cardExpMonthInput.value = paymentMethod.card.exp_month;
        cardExpYearInput.value = paymentMethod.card.exp_year;
    }

    cardHolderInput.value = paymentMethod.billing_details && paymentMethod.billing_details.name;
    prUsedInput.value = '';
}

function initNewCardForm() {
    var postalCodeEl = document.querySelector('input[name$="_postal"]');
    cardElement = elements.create('card', { value: { postalCode: postalCodeEl.value }, style: JSON.parse(document.getElementById('yuansferCardFormStyle').value) });
    cardElement.mount('#card-element');

    postalCodeEl.addEventListener('change', function (event) {
        cardElement.update({ value: { postalCode: event.target.value } });
    });

    var switchToSavedCardsLink = document.getElementById('switch-to-saved-cards');
    if (switchToSavedCardsLink) {
        switchToSavedCardsLink.addEventListener('click', function () {
            newCardFormContainer.style.display = 'none';
            savedCardsFormContainer.style.display = 'block';
        });
    }
}

function initSavedCards() {
    var switchToNewCardLink = document.getElementById('switch-to-add-card');
    if (switchToNewCardLink) {
        switchToNewCardLink.addEventListener('click', function () {
            newCardFormContainer.style.display = 'block';
            savedCardsFormContainer.style.display = 'none';
        });
    }
}

function initIdeal() {
    idealBankElement = elements.create('idealBank', { style: JSON.parse(document.getElementById('yuansferIdealElementStyle').value) });

    idealBankElement.mount('#ideal-bank-element');
}

function populateBillingData(pr) {
    var payerName = pr.payerName;
    if (payerName) {
        var payerNameSplit = payerName.split(' ');

        if (payerNameSplit.length > 1) {
            var firstName = payerNameSplit[0];
            var lastName = payerNameSplit[1];

            document.querySelector('input[name$="_firstName"]').value = firstName;
            document.querySelector('input[name$="_lastName"]').value = lastName;
        } else {
            document.querySelector('input[name$="_firstName"]').value = payerName;
            document.querySelector('input[name$="_lastName"]').value = payerName;
        }
    }

    document.querySelector('input[id="cardholder-name"]').value = payerName;
    document.querySelector('input[name$="_email_emailAddress"]').value = pr.payerEmail;
    document.querySelector('input[name$="_phone"]').value = pr.payerPhone;

    var selectCountryElement = document.querySelector('select[name$="_country"]');
    var prCountry = pr.paymentMethod.billing_details.address.country.toLowerCase();
    var prCountryExists = ($('#' + selectCountryElement.id + ' option[value=' + prCountry + ']').length > 0);

    if (prCountryExists) {
        selectCountryElement.value = prCountry;
    }

    document.querySelector('input[name$="_city"]').value = pr.paymentMethod.billing_details.address.city;
    document.querySelector('input[name$="_postal"]').value = pr.paymentMethod.billing_details.address.postal_code;
    document.querySelector('input[name$="_address1"]').value = pr.paymentMethod.billing_details.address.line1;
    document.querySelector('input[name$="_address2"]').value = pr.paymentMethod.billing_details.address.line2;

    var stateElement = document.querySelector('select[name$="_state"]') || document.querySelector('input[name$="_state"]');
    stateElement.value = pr.paymentMethod.billing_details.address.state;
}


function initYuansfer() {
    var merchantNo = document.getElementById('yuansfer_merchant_no').value;
    var storeNo = document.getElementById('yuansfer_store_no').value;
    var token = document.getElementById('yuansfer_token').value;
    var env = document.getElementById('yuansfer_env').value;
    var isvFlag = 0;
    Yuansfer.init({
        merchantNo: merchantNo,
        storeNo: storeNo,
        token: token,
        isvFlag: isvFlag,
        env: env
    })
}

function getSecurePayPayload() {
    var yuansferOrderNumberInput = document.getElementById('yuansfer_order_number');
    var yuansferReturnURLInput = document.getElementById('yuansfer_return_url');
    var yuansferOrderAmountInput = document.getElementById('yuansfer_order_amount');
    var yuansferOrderCurrencyInput = document.getElementById('yuansfer_order_currency');
    var yuansferOrderNoteInput = document.getElementById('yuansfer_order_note');
    var yuansferOrderDescriptionInput = document.getElementById('yuansfer_order_description');
    var yuansferOrderGoodsInput = document.getElementById('yuansfer_order_goods');
    var yuansferOrderSettleCurrencyInput = document.getElementById('yuansfer_order_settle_currency');

    var amountToPay = parseFloat(yuansferOrderAmountInput.value);
    var currencyCode = yuansferOrderCurrencyInput.value;
    var settleCurrencyCode = yuansferOrderSettleCurrencyInput.value;
    var returnURL = yuansferReturnURLInput.value;
    var terminal = "ONLINE";
    var vendor = "";

    return {
        amount: amountToPay,                       
        currency: currencyCode,        
        vendor: vendor,                             
        callbackUrl: returnURL,      
        terminal: terminal,            
        reference: yuansferOrderNumberInput,          
        description: yuansferOrderDescriptionInput,      
        note: yuansferOrderNoteInput,                                 
        goodsInfo: yuansferOrderGoodsInput            
    };
}

function processSecurePayResult(result) {
    if (result.ret_code!="000100") {
        alert(result.ret_msg);
    } else {

        document.getElementById('dwfrm_billing').submit();
    }
}

document.querySelector('button.submit-payment').addEventListener('click', function (event) {
    let billingForm = document.getElementById('dwfrm_billing');
    $(billingForm).find('.form-control.is-invalid').removeClass('is-invalid');
    if (!billingForm.reportValidity()) {
        billingForm.focus();
        billingForm.scrollIntoView();
        return;
    }

    event.stopImmediatePropagation();
    var selectedPaymentMethod = getSelectedPaymentMethod();
    var params;

    switch (selectedPaymentMethod) {
        case 'CREDIT_CARD':
            if (prUsed) {
                break;
            } else if (isSavedCard()) {
                copySelectedSaveCardDetails();
            } else {
                event.preventDefault();

                var cardholderName = document.getElementById('cardholder-name');
                var owner = getOwnerDetails();

                yuansfer.createPaymentMethod('card', cardElement, {
                    billing_details: {
                        name: cardholderName.value,
                        address: owner.address,
                        email: owner.email,
                        phone: owner.phone
                    }
                }).then(function (result) {
                    if (result.error) {
                        alert(result.error.message);
                    } else {
                        copyNewCardDetails(result.paymentMethod);
                        document.getElementById('dwfrm_billing').submit();
                    }
                });
            }
            break;
        case 'YUANSFER_WECHATPAY':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "wechatpay";
            
            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"wechatpay"));
            break;
        case 'YUANSFER_ALIPAY':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "alipay";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"alipay"));
            break;
        case 'YUANSFER_DANA':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "dana";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"dana"));
            break;
        case 'YUANSFER_ALIPAYHK':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "alipay_hk";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"alipay_hk"));
            break;
        case 'YUANSFER_GCASH':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "gcash";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"gcash"));
            break;
        case 'YUANSFER_KAKAOPAY':
            event.preventDefault();

            params = getSecurePayPayload();

            params.vendor = "kakaopay";

            yuansfer.securePay(params).then(res=>processQRCodeResult(res,"kakaopay"));
            break;
        default:
            event.preventDefault();

            alert('Unknown payment method');
    }
})

function init() {
    if (newCardFormContainer) {
        initNewCardForm();
    }

    initYuansfer();
}

function handleServerResponse(response) {
    if (response.error) {
        alert(response.error.message);
        window.location.replace(document.getElementById('billingPageUrl').value);
    } else if (response.requires_action) {
        // Use Stripe.js to handle required card action
        yuansfer.handleCardAction(response.payment_intent_client_secret).then(function (result) {
            if (result.error) {
                alert(result.error.message);
                window.location.replace(document.getElementById('billingPageUrl').value);
            } else {
                // The card action has been handled
                // The PaymentIntent can be confirmed again on the server
                $.ajax({
                    url: document.getElementById('beforePaymentAuthURL').value,
                    method: 'POST',
                    dataType: 'json',
                    data: {
                        csrf_token: $('[name="csrf_token"]').val()
                    }
                }).done(function (json) {
                    handleServerResponse(json);
                }).error(function (msg) {
                    if (msg.responseJSON.redirectUrl) {
                        window.location.href = msg.responseJSON.redirectUrl;
                    } else {
                        alert(msg.error);
                    }
                });
            }
        });
    } else {
        forceSubmit = true;
        placeOrderButton.click();
    }
}

function initSummary() {
    // v1
    // eslint-disable-next-line consistent-return
    placeOrderButton.addEventListener('click', function (event) {
        if (forceSubmit) return true;

        event.preventDefault();

        $.ajax({
            url: document.getElementById('beforePaymentAuthURL').value,
            method: 'POST',
            dataType: 'json',
            data: {
                csrf_token: $('[name="csrf_token"]').val()
            }
        }).done(function (json) {
            handleServerResponse(json);
        }).fail(function (msg) {
            if (msg.responseJSON.redirectUrl) {
                window.location.href = msg.responseJSON.redirectUrl;
            } else {
                alert(msg.error);
            }
        });
    });
}

if (placeOrderButton) {
    init();
    initSummary();
}

function processQRCodeResult(result,vendor) {
    if (result.ret_code!="000100") {
        alert(result.ret_msg);
    } else {
        switch(vendor){
            case "wechatpay":
                var wechatPayQRCodeURL = document.getElementById('yuansfer_wechat_qrcode_url');
                wechatPayQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "alipay":
                var alipayQRCodeURL = document.getElementById('yuansfer_alipay_qrcode_url');
                alipayQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "dana":
                var danaQRCodeURL = document.getElementById('yuansfer_dana_qrcode_url');
                danaQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "alipay_hk":
                var alipayHKQRCodeURL = document.getElementById('yuansfer_alipayhk_qrcode_url');
                alipayHKQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "kakaopay":
                var kakaoPayQRCodeURL = document.getElementById('yuansfer_kakaopay_qrcode_url');
                kakaoPayQRCodeURL.value = result.result.qrcodeUrl;   
                break;
            case "gcash":
                var gcashQRCodeURL = document.getElementById('yuansfer_gcash_qrcode_url');
                gcashQRCodeURL.value = result.result.qrcodeUrl;   
                break;
                
        }
        document.getElementById('dwfrm_billing').submit();
    }
}
