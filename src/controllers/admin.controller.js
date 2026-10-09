import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

export const getAdminStats = async (req, res) => {
  try {
    const { range } = req.query; // 'weekly', 'monthly', 'yearly', 'total'
    let startDate = null;
    const now = new Date();

    if (range === 'weekly') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'monthly') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === 'yearly') {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    }

    const orderDateFilter = startDate ? { createdAt: { $gte: startDate } } : {};
    const userDateFilter = startDate ? { createdAt: { $gte: startDate } } : {};

    const totalUsers = await User.countDocuments(userDateFilter);
    const totalOrders = await Order.countDocuments(orderDateFilter);
    const deliveredOrders = await Order.countDocuments({
      ...orderDateFilter,
      deliveryStatus: 'Delivered',
    });
    const pendingOrders = await Order.countDocuments({
      ...orderDateFilter,
      deliveryStatus: { $in: ['Pending', 'Processing'] },
    });

    // Total Sales — exclude Cancelled orders
    const salesMatch = { paymentStatus: 'Paid', deliveryStatus: { $ne: 'Cancelled' } };
    if (startDate) salesMatch.createdAt = { $gte: startDate };
    const salesAggregate = await Order.aggregate([
      { $match: salesMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalSales = salesAggregate.length > 0 ? salesAggregate[0].total : 0;

    // Total Paid Taka — exclude Cancelled orders
    const paidMatch = { paymentStatus: 'Paid', deliveryStatus: { $ne: 'Cancelled' } };
    if (startDate) paidMatch.createdAt = { $gte: startDate };
    const paidAggregate = await Order.aggregate([
      { $match: paidMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalPaid = paidAggregate.length > 0 ? paidAggregate[0].total : 0;

    // Total Pending Taka — exclude Cancelled orders
    const pendingPayMatch = { paymentStatus: 'Pending', deliveryStatus: { $ne: 'Cancelled' } };
    if (startDate) pendingPayMatch.createdAt = { $gte: startDate };
    const pendingPayAggregate = await Order.aggregate([
      { $match: pendingPayMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalPendingAmount = pendingPayAggregate.length > 0 ? pendingPayAggregate[0].total : 0;

    // Total Cancelled Taka
    const cancelledMatch = { deliveryStatus: 'Cancelled' };
    if (startDate) cancelledMatch.createdAt = { $gte: startDate };
    const cancelledAggregate = await Order.aggregate([
      { $match: cancelledMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalCancelledAmount = cancelledAggregate.length > 0 ? cancelledAggregate[0].total : 0;

    res.json({
      totalSales,
      totalUsers,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      totalPaid,
      totalPendingAmount,
      totalCancelledAmount,
      range: range || 'total',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsersWithOrders = async (req, res) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'userId',
          as: 'orders',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          createdAt: 1,
          ordersCount: { $size: '$orders' },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'editor', 'user'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, editor, or user.' });
    }

    // Prevent admin from changing their own role accidentally
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid delivery status provided' });
    }

    const previousOrder = await Order.findById(req.params.id);
    if (!previousOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // If order is newly cancelled, restore product stock in MongoDB
    if (status === 'Cancelled' && previousOrder.deliveryStatus !== 'Cancelled') {
      for (const item of previousOrder.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity },
          });
        }
      }
    }

    // If order was cancelled and is now set back to active, re-deduct stock
    if (previousOrder.deliveryStatus === 'Cancelled' && status !== 'Cancelled') {
      for (const item of previousOrder.items) {
        if (item.product) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
          await Product.updateOne({ _id: item.product, stock: { $lt: 0 } }, { $set: { stock: 0 } });
        }
      }
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { deliveryStatus: status },
      { new: true }
    );

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const validStatuses = ['Paid', 'Pending'];

    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status. Use Paid or Pending.' });
    }

    const existing = await Order.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Cancelled orders cannot have their payment status changed
    if (existing.deliveryStatus === 'Cancelled') {
      return res.status(400).json({ message: 'Cannot change payment status of a Cancelled order.' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
