/* eslint-disable no-alert */
/* globals cardElement, Yuansfer */
// v1
var $form = $('.payment-form');
var yuansfer = Yuansfer(document.getElementById('yuansferPublicKey').value);
var elements = yuansfer.elements();

window.cardElement = window.cardElement || elements.create('card', { style: $form.data('element-style') });
cardElement.mount('#card-element');

var $cardHolderNameInput = $('#yuansfer-cardholder-name');

function closeDialog() {
    var $dialogContainer = $('#dialog-container');
    if ($dialogContainer.length) {
        $dialogContainer.dialog('close');
    }
}

var cancelBtn = document.getElementById('yuansferCancelBtn');
cancelBtn.addEventListener('click', function () {
    closeDialog();
});

var $addCardBtn = $('#yuansferApplyBtn');
$addCardBtn.on('click', function () {

    yuansfer.createPaymentMethod('card', cardElement, {
        billing_details: {
            name: $cardHolderNameInput.val()
        }
    }).then(function (result) {
        if (result.error) {
            alert(result.error.message);
        } else {
            var paymentMethodId = result.paymentMethod.id;
            $.ajax({
                url: $form.attr('action'),
                method: 'POST',
                data: {
                    payment_method_id: paymentMethodId,
                    csrf_token: $('name[name="csrf_token"]').val()
                }
            }).done(function (msg) {
                if (msg.success) {
                    // eslint-disable-next-line no-restricted-globals
                    location.reload();
                } else {
                    alert(msg.error);
                }
            }).error(function (msg) {
                if (msg.responseJSON.redirectUrl) {
                    window.location.href = msg.responseJSON.redirectUrl;
                } else {
                    alert(msg);
                }
            });
        }
    });
    closeDialog();
});
