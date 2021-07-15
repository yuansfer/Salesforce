/* eslint-disable no-console */
/* eslint-disable no-alert */
/* globals yuansfer */
// v3
$body = $("body");
window.mobileAndTabletCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|Mobile|avantgo|bada\/|blackberry|huawei|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};
var isMobile = window.mobileAndTabletCheck();
var placeOrderButton = document.querySelector('button[name=submit]');
var forceSubmit = false;
var prUsed = false;
var yuansfer_url="";
var yuansfer_qrc=null;
var yuansfer_payment_window=null;
let yuansferReturnURL = document.getElementById('yuansfer_return_url_in_checkout').value;
var orderNumber = document.getElementById('yuansfer_order_number').value;
var merchantNo = document.getElementById('yuansfer_merchant_no').value;
var storeNo = document.getElementById('yuansfer_store_no').value;
var token = document.getElementById('yuansfer_token').value;
var yuansferOrderNumberInput = document.getElementById('yuansfer_order_number').value;
var yuansferOrderAmountInput = document.getElementById('yuansfer_order_amount').value;
var yuansferOrderCurrencyInput = document.getElementById('yuansfer_order_currency');
var yuansferOrderNoteInput = document.getElementById('yuansfer_order_note');
var yuansferOrderDescriptionInput = document.getElementById('yuansfer_order_description');
var yuansferOrderGoodsInput = document.getElementById('yuansfer_order_items').value;
var yuansfer_transaction_number=null;

function calculateVerifySign(contents) {
    // 1.sort parameter，connect them with a=1&b=2.. format
    var sortArray = [];

    Object.keys(contents).sort().forEach(function (k) {
        if (contents[k] || contents[k] === false) {
            sortArray.push(k + '=' + contents[k]);
        }
    });

    // md5 encrypt token，append result after sortArray
    sortArray.push(MD5(token));

    var tempStr = sortArray.join('&');

    // md5 encrypt tempStr to get verify sign
    var verifySign = MD5(tempStr);

    return verifySign;
}

/**
 * get yuansfer request payload
 * @param {string} vendor
 */
function getSecurePayPayload(vendor) {

    var currencyCode = yuansferOrderCurrencyInput.value;
    var terminal = null;
    var callBack=null;
    var amountToPay = yuansferOrderAmountInput;
    const QRCVendor =['wechatpay','kakaopay','alipay'];
    var osType = null;
    //set params base on vendor or device
    if(isMobile || QRCVendor.includes(vendor)){
        terminal = 'WAP';
    }else{
        terminal = 'ONLINE';
    }

    //calculate correct currency amount
    if(vendor === 'kakaopay'){
        Math.ceil(amountToPay);
        osType = 'IOS';
    } else if(vendor === 'dana') {
        Math.ceil(amountToPay);
    }

    amountToPay = parseFloat(amountToPay);
    var reference = yuansferOrderNumberInput+'-'+token;

    if(isMobile){
        callBack = yuansferReturnURL;
    } else {
        callBack = null;
    }

    var param = {
        merchantNo: merchantNo,
        storeNo: storeNo,
        amount: amountToPay,
        currency: currencyCode,
        settleCurrency: 'USD',
        vendor: vendor,
        callbackUrl: callBack,
        terminal: terminal,
        reference: reference,
        description: yuansferOrderDescriptionInput,
        note: yuansferOrderNoteInput,
        goodsInfo: yuansferOrderGoodsInput,
        osType:osType
    };
    var verifySign = calculateVerifySign(param, token);
    param.verifySign = verifySign;
    return param;
}

/**
 * validate on email format
 * @param {string} email
 */
function notEmailFormat(email) {
     /**
       * @return {boolean}
      */
    const reg = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return !reg.test(email);
}

/**
 * check if field is valid
 * @param {element} seletor
 */
function checkFieldNotPass(seletor) {
    // check fields
    var flag = false;
    var contactInfos = $(seletor);
    for (let info of contactInfos) {
        if (!info.value) {
            flag = true;
            break;
        } else if (info.name && info.name.indexOf('email') !== -1) {
            flag = notEmailFormat(info.value);
            if (flag) {
                break;
            }
        }
    }
    return flag;
}

/**
 * pop up page
 * @param {*} myURL
 * @param {*} title
 * @param {*} myWidth
 * @param {*} myHeight
 */
function popup(myURL, myWidth, myHeight) {
    var left = (screen.width - myWidth) / 2;
    var top = (screen.height - myHeight) / 4;
    yuansfer_payment_window = window.open(myURL, '_blank', 'toolbar=yes, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=' + myWidth + ', height=' + myHeight + ', top=' + top + ', left=' + left);
 }

document.querySelector('button.submit-payment').addEventListener('click', function (event) {
    if (checkFieldNotPass('#dwfrm_billing .contact-info-block input')) {
        return false;
    }
    $.spinner().start();
    var activeTabId = $('.tab-pane.active').attr('id');
    var paymentInfoSelector = '#dwfrm_billing .' + activeTabId + ' .payment-form-fields input.form-control';
    var selectedPaymentMethod = $(paymentInfoSelector).val();

    window.localStorage.setItem('yuansfer_payment_method', selectedPaymentMethod);
    document.getElementById('dwfrm_billing').submit();
    window.location.replace(yuansferReturnURL);
    $.spinner().stop();
});

/**
 * Get Yuansfer global params
 */
function getGlobalParams() {
    var selectedPaymentMethod = window.localStorage.getItem('yuansfer_payment_method');
    // var params = getSecurePayPayload();
    let params;

    switch (selectedPaymentMethod) {
        case 'YUANSFER_CREDITCARD':

            params = getSecurePayPayload('creditcard');
            break;
        case 'YUANSFER_WECHATPAY':

            params = getSecurePayPayload('wechatpay');
            break;
        case 'YUANSFER_ALIPAY':

            params = getSecurePayPayload('alipay');
            break;
        case 'YUANSFER_DANA':

            params = getSecurePayPayload('dana');
            break;
        case 'YUANSFER_ALIPAYHK':

            params = getSecurePayPayload('alipay_hk');
            break;
        case 'YUANSFER_GCASH':

            params = getSecurePayPayload('gcash');
            break;
        case 'YUANSFER_KAKAOPAY':

            params = getSecurePayPayload('kakaopay');
            break;
        case 'YUANSFER_PAYPAL':

            params = getSecurePayPayload('paypal');
            break;
        case 'YUANSFER_UNIONPAY':

            params = getSecurePayPayload('unionpay');
            break;
        case 'YUANSFER_VENMO':

            params = getSecurePayPayload('venmo');
            break;
        default:

            alert('Unknown payment method');
    }
    return params;
}

$('.yuansferModal').on('shown.bs.modal', function () {
    var qrcElement = document.getElementById('yuansfer_qrc_element').value;
    if(yuansfer_qrc === null){
        yuansfer_qrc = new QRCode(document.getElementById(qrcElement),
        {
            text: yuansfer_url,
            width: 150,
            height: 150
        });
    } else {
        yuansfer_qrc.clear();
        yuansfer_qrc.makeCode(yuansfer_url);
    }

})

document.querySelector('button.place-order').addEventListener('click', function (event) {

    event.preventDefault();
    event.stopPropagation();

    var currentParams = getGlobalParams();
    var token = $('[name="csrf_token"]').val();
    $.ajax({
        url: document.getElementById('beforePaymentAuthURL').value,
        type: 'POST',
        dataType: 'json',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            params: JSON.stringify(currentParams),
            ismobile:isMobile,
        },
        beforeSend:function(){
            $body.addClass("loading");
        },
        complete: function(){
            $body.removeClass("loading");
        },
        data: {
            csrf_token: token
        }
    }).done(function (json) {
        if (json.ret_code == '000100') {
            yuansfer_url = json.result.cashierUrl;
            yuansfer_transaction_number = json.result.transactionNo;
            if(isMobile){

                window.location.href =json.result.cashierUrl;
            } else {
                if(currentParams.vendor === 'alipay'){

                    $('#alipayQRCModal').modal('show');

                }else if(currentParams.vendor === 'wechatpay') {

                    $('#wechatpayQRCModal').modal('show');

                }else if(currentParams.vendor === 'kakaopay') {

                    $('#kakaopayQRCModal').modal('show');

                } else {
                    $body.addClass("loading");
                    if(yuansfer_payment_window && !yuansfer_payment_window.closed){
                        yuansfer_payment_window.close();
                    }
                    popup(json.result.cashierUrl,"500","500");
                }
            }
        } else if (json.error) {
            alert(json.error.message);
        } else {
            alert(json.ret_msg);
        }
    }).fail(function (msg) {
        if (msg.responseJSON.redirectUrl) {
            window.location.href = msg.responseJSON.redirectUrl;
        } else {
            alert(msg.error);
        }
    });
});

$('body').on('click', function (e) {
    if(yuansfer_payment_window && !yuansfer_payment_window.closed){
        e.preventDefault();
        parent_close();
    }
});
$('body').on('focus', function (e) {
    if(yuansfer_payment_window && !yuansfer_payment_window.closed){
        e.preventDefault();
        parent_close();
    }
});

function parent_disable() {

    yuansfer_payment_window.focus();
}
function parent_close(){

    yuansfer_payment_window.close();

}

var ready = (callback) => {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', callback);
    }
};

ready(() => {
    // eslint-disable-next-line no-unused-vars
    document.querySelector('.payment-summary .edit-button').addEventListener('click', (e) => {
        var list = document.querySelector('.payment-form').querySelectorAll('.tab-pane');
        for (var i = 0; i < list.length; ++i) {
            list[i].classList.remove('active');
        }

        var activePaymentMethod = document.getElementsByClassName('nav-link credit-card-tab active');
        if (activePaymentMethod.length) {
            var selectedPaymentContent = document.getElementById(activePaymentMethod[0].attributes.href.value.replace('#', ''));

            if (selectedPaymentContent) {
                selectedPaymentContent.classList.add('active');
            }
        }
    });

    // eslint-disable-next-line no-unused-vars
    document.querySelector('.shipping-summary .edit-button').addEventListener('click', (e) => {
        var list = document.querySelector('.payment-form').querySelectorAll('.tab-pane');
        for (var i = 0; i < list.length; ++i) {
            list[i].classList.remove('active');
        }

        var activePaymentMethod = document.getElementsByClassName('nav-link credit-card-tab active');
        if (activePaymentMethod.length) {
            var selectedPaymentContent = document.getElementById(activePaymentMethod[0].attributes.href.value.replace('#', ''));
            if (selectedPaymentContent) {
                selectedPaymentContent.classList.add('active');
            }
        }
    });
});

/**
 * Get Yuansfer request parameter
 */
 var _GetYuansferParams = function () {
    var params = {
        merchantNo: merchantNo,
        storeNo: storeNo,
        reference: yuansferOrderNumberInput+'-'+token
    };
    var verifySign = calculateVerifySign(params);
    params.verifySign = verifySign;
    return params;

};

/**
 * polling function
 * @param {string} _queryUrl
 * @param {string} _redirectUrl
 */
var _Polling = function (_queryUrl, _redirectUrl) {
    var _num = 400;
    var queryUrl = document.getElementById('yuansfer_trans_query_url').value;
    var t = setInterval(function () {
        _num--;
        var params = _GetYuansferParams();
        if(params){
            $.ajax({
                url: queryUrl,
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                data: params
            }).done(function (json) {
                if (json != null) {
                    var _ret_code = json.ret_code;
                    var _ret_msg = json.ret_msg;
                    if (_ret_code == '000100') {
                        var _status = json.result.status;
                        if (_status == 'fail') {
                            clearInterval(t);
                        } else if (_status == 'success') {
                            if(yuansfer_payment_window){
                                yuansfer_payment_window.close();
                                $body.removeClass("loading");
                            }
                            clearInterval(t);
                            var form = $('button.btn.btn-primary.btn-block.place-order');
                            form.trigger('click');
                        } else {
                                    // continue
                        }
                    } else if (_ret_code = '000000') {
                        console.log(_ret_msg);
                    }
                } else {
                    console.log('query error');
                }
            }).fail(function (err) {
                console.log(err);
            });
        }

        if (_num == 0) {
            clearInterval(t);
        }
        // }
    }, 4000);
};

/**
 * trigger function when dom is ready
 * @param {function} fn
 */
function _ready(fn) {
    if (document.addEventListener) {
        // Regular browser
        document.addEventListener('DOMContentLoaded', function () {
            // prevent repeat event
            document.removeEventListener('DOMContentLoaded', arguments.callee, false);
            // execute function
            fn;
        }, false);
    } else if (document.attachEvent) {
        // IE Browser
        document.attachEvent('onreadystatechange', function () {
            if (document.readyState == 'complete') {
                document.detachEvent('onreadystatechange', arguments.callee);
                // execute function
                fn;
            }
        });
    }
}

_ready(_Polling());


var a ={"intent":"sale","payer":{"payment_method":"credit_card","funding_instruments":[{"creditCard":{"cvv2":"999","expireMonth":"12","expireYear":"2028","number":"4111111111111111","type":"visa"}}]},"transactions":[{"amount":{"total":"6.67","currency":"USD"},"payee":{"merchant_id":"5UDNRYLMV32Q4"},"description":"Yuansfer Sandbox","note_to_payee":"express pay","invoice_number":"20210514001931"}]}