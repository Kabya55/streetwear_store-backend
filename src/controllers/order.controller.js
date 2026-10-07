import crypto from 'crypto';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import Setting from '../models/Setting.js';

export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Cart items cannot be empty' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.fullAddress) {
      return res.status(400).json({ message: 'Incomplete shipping credentials' });
    }

    // 1. Fetch each product from MongoDB and calculate authentic price on the backend
    let calculatedSubtotal = 0;
    const verifiedOrderItems = [];

    for (const item of items) {
      const productId = item.product || item._id || item.id;
      const dbProduct = await Product.findById(productId);

      if (!dbProduct) {
        return res.status(404).json({
          message: `Product '${item.title || productId}' no longer exists in store catalog`,
        });
      }

      const verifiedPrice = Number(dbProduct.price);
      const qty = Math.max(1, Number(item.quantity) || 1);
      calculatedSubtotal += verifiedPrice * qty;

      const itemDelivery =
        dbProduct.deliveryCharge !== undefined ? Number(dbProduct.deliveryCharge) : 120;

      verifiedOrderItems.push({
        product: dbProduct._id,
        title: dbProduct.title,
        price: verifiedPrice, // 100% database-calculated price from MongoDB
        quantity: qty,
        selectedSize: item.selectedSize || 'EU 42',
        image: dbProduct.images?.[0] || item.image || '',
        deliveryCharge: itemDelivery,
      });

      // Deduct quantity from product stock in MongoDB
      await Product.findByIdAndUpdate(dbProduct._id, {
        $inc: { stock: -qty },
      });
      await Product.updateOne({ _id: dbProduct._id, stock: { $lt: 0 } }, { $set: { stock: 0 } });
    }

    // Sum ALL items' delivery charges from DB — once per product line, not per quantity
    const shippingCharge = verifiedOrderItems.reduce(
      (sum, it) => sum + Number(it.deliveryCharge ?? 0),
      0
    );
    const verifiedTotalAmount = calculatedSubtotal + shippingCharge;

    // 2. Determine User ID from verified JWT session
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required. Please log in to place an order.' });
    }

    const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 3. Save order to MongoDB with database-calculated total
    const order = await Order.create({
      userId,
      items: verifiedOrderItems,
      totalAmount: verifiedTotalAmount,
      shippingCharge,
      shippingAddress,
      transactionId,
      paymentStatus: 'Pending',
      deliveryStatus: 'Pending',
    });

    // 4. Clear user cart in MongoDB upon order generation
    try {
      await Cart.findOneAndUpdate({ userId }, { items: [] });
    } catch (cartErr) {
      // non-critical
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('[Create Order Error]', error);
    res.status(500).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order record not found' });
    }

    // Ensure only the owner or an admin can access this order
    if (order.userId._id.toString() !== req.user?._id?.toString() && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
