import SSLCommerzPayment from 'sslcommerz-lts';
import Order from '../models/Order.js';

export const initPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await Order.findById(orderId).populate('userId');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const store_id = process.env.SSLCOMMERZ_STORE_ID;
    const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
    const is_live = process.env.SSLCOMMERZ_IS_SANDBOX === 'false';
    const backendUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000';
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    const tran_id = order.transactionId;

    const safeTitle = order.items.map((i) => i.title.replace(/[^a-zA-Z0-9 ]/g, '')).join(', ').substring(0, 50) || 'Footwear';
    const safeCustomer = (order.shippingAddress.fullName || 'Customer').replace(/[^a-zA-Z0-9 ]/g, '');
    const safeEmail = order.shippingAddress.email || order.userId?.email || 'customer@gmail.com';
    const safePhone = (order.shippingAddress.phone || '01700000000').replace(/[^0-9]/g, '');
    const safeAddress = (order.shippingAddress.fullAddress || 'Dhaka').replace(/[^a-zA-Z0-9, -]/g, '').substring(0, 100);
    const safeCity = (order.shippingAddress.district || 'Dhaka').replace(/[^a-zA-Z0-9 ]/g, '');

    const paymentData = {
      total_amount: Number(order.totalAmount).toFixed(2),
      currency: 'BDT',
      tran_id: tran_id,
      success_url: `${backendUrl}/api/payment/success/${tran_id}`,
      fail_url: `${backendUrl}/api/payment/fail/${tran_id}`,
      cancel_url: `${backendUrl}/api/payment/cancel/${tran_id}`,
      ipn_url: `${backendUrl}/api/payment/ipn`,
      shipping_method: 'Courier',
      product_name: safeTitle,
      product_category: 'Footwear',
      product_profile: 'general',
      cus_name: safeCustomer,
      cus_email: safeEmail,
      cus_add1: safeAddress,
      cus_city: safeCity,
      cus_state: safeCity,
      cus_postcode: '1200',
      cus_country: 'Bangladesh',
      cus_phone: safePhone,
      ship_name: safeCustomer,
      ship_add1: safeAddress,
      ship_city: safeCity,
      ship_postcode: '1200',
      ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

    const apiResponse = await sslcz.init(paymentData);

    if (apiResponse && apiResponse.GatewayPageURL) {
      return res.json({
        success: true,
        url: apiResponse.GatewayPageURL,
        sessionkey: apiResponse.sessionkey,
        transactionId: tran_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'SSLCommerz session initialization failed',
        error: apiResponse,
      });
    }
  } catch (error) {
    console.error('[SSLCommerz Init Error]', error);
    res.status(500).json({ message: error.message });
  }
};

export const handlePaymentSuccess = async (req, res) => {
  const { tranId } = req.params;
  const paymentDetails = req.body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  try {
    const order = await Order.findOneAndUpdate(
      { transactionId: tranId },
      {
        paymentStatus: 'Paid',
        deliveryStatus: 'Processing',
        paymentGatewayResponse: paymentDetails,
      },
      { new: true }
    );

    if (!order) {
      return res.redirect(`${clientUrl}/payment/fail?error=order_not_found`);
    }

    return res.redirect(`${clientUrl}/payment/success?tranId=${tranId}`);
  } catch (error) {
    console.error('[SSLCommerz Success Handler Error]', error);
    return res.redirect(`${clientUrl}/payment/fail?tranId=${tranId}`);
  }
};

export const handlePaymentFail = async (req, res) => {
  const { tranId } = req.params;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  try {
    await Order.findOneAndUpdate(
      { transactionId: tranId },
      {
        paymentStatus: 'Failed',
        paymentGatewayResponse: req.body,
      }
    );
    return res.redirect(`${clientUrl}/payment/fail?tranId=${tranId}`);
  } catch (error) {
    return res.redirect(`${clientUrl}/payment/fail?tranId=${tranId}`);
  }
};

export const handlePaymentCancel = async (req, res) => {
  const { tranId } = req.params;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  try {
    const order = await Order.findOne({ transactionId: tranId });
    if (order) {
      if (order.deliveryStatus !== 'Cancelled') {
        for (const item of order.items) {
          if (item.product) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity },
            });
          }
        }
      }
      order.paymentStatus = 'Failed';
      order.deliveryStatus = 'Cancelled';
      order.paymentGatewayResponse = req.body;
      await order.save();
    }
    return res.redirect(`${clientUrl}/cart?cancelled=true`);
  } catch (error) {
    return res.redirect(`${clientUrl}/cart?error=cancel_failed`);
  }
};

export const handleIPN = async (req, res) => {
  try {
    const paymentData = req.body;
    if (paymentData && (paymentData.status === 'VALID' || paymentData.status === 'VALIDATED')) {
      await Order.findOneAndUpdate(
        { transactionId: paymentData.tran_id },
        {
          paymentStatus: 'Paid',
          paymentGatewayResponse: paymentData,
        }
      );
    }
    return res.status(200).send('IPN Received');
  } catch (error) {
    console.error('[SSLCommerz IPN Error]', error);
    return res.status(500).send('IPN processing error');
  }
};
