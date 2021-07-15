import ProductPage from '../pages/productPage';
import CartPage from '../pages/cartPage';
import CheckoutPage from '../pages/checkoutPage';
import Data from '../data/addresses';
import OrderPage from '../pages/orderPage';
import StripeAlipayPage from '../pages/stripeAlipayPage';
import Secure3DPage from '../pages/secure3DPage';

describe('Checkout', () => {
    const productPage = new ProductPage('25519318M');
    const checkoutPage = new CheckoutPage();
    const orderPage = new OrderPage();
    const alipayPage = new StripeAlipayPage();
    const secure3DPage = new Secure3DPage();

    beforeEach(async () => {
        await productPage.goto();
        await productPage.addProductToCart();
        await checkoutPage.goto();
    });

    afterEach(async () => {
        const cartPage = new CartPage();
        await cartPage.goto();
        await cartPage.deleteProductFromCart();
    });

    it('should checkout product with Yuansfer Credit Card', async () => {
        await checkoutPage.fillShippingAddress(Data.shippingAddress);
        await checkoutPage.shippingSummaryDisplayed();
        await checkoutPage.fillBillingDataAndCard(Data.billing, 'YUANSFER_CREDITCARD');
        await checkoutPage.paymentSummaryDisplayed();
        await checkoutPage.submitPlaceOrder();
        expect(await orderPage.loaded()).toBe(true);
        expect(await orderPage.getPaymentDetails()).toEqual('Pay with Yuansfer Credit Card');
    });

    it('should checkout product with Wechat', async () => {
        await checkoutPage.fillShippingAddress(Data.shippingAddress);
        await checkoutPage.shippingSummaryDisplayed();
        await checkoutPage.fillBillingDataWithPaymentMethod(Data.billing, 'YUANSFER_WECHATPAY');
        await checkoutPage.paymentSummaryDisplayed();
        await checkoutPage.submitPlaceOrder();
        expect(await orderPage.loaded()).toBe(true);
        expect(await orderPage.getPaymentDetails()).toEqual('Pay with Wechat');
    });

    it('should checkout product with Alipay', async () => {
        await checkoutPage.fillShippingAddress(Data.shippingAddress);
        await checkoutPage.shippingSummaryDisplayed();
        await checkoutPage.fillBillingDataWithPaymentMethod(Data.billing, 'YUANSFER_ALIPAY');
        await checkoutPage.paymentSummaryDisplayed();
        await checkoutPage.submitPlaceOrder();
        expect(await orderPage.loaded()).toBe(true);
        expect(await orderPage.getPaymentDetails()).toEqual('Pay with Alipay');
    });

    it('should checkout product with Paypal', async () => {
        await checkoutPage.fillShippingAddress(Data.shippingAddress);
        await checkoutPage.shippingSummaryDisplayed();
        await checkoutPage.fillBillingDataWithPaymentMethod(Data.billing, 'YUANSFER_PAYPAL');
        await checkoutPage.paymentSummaryDisplayed();
        await checkoutPage.submitPlaceOrder();
        expect(await orderPage.loaded()).toBe(true);
        expect(await orderPage.getPaymentDetails()).toEqual('Pay with Paypal');
    });

});
