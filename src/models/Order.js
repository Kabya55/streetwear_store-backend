import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  selectedSize: {
    type: String,
    default: 'EU 42',
  },
  image: {
    type: String,
    default: '',
  },
  deliveryCharge: {
    type: Number,
    default: 120,
  },
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  district: { type: String, required: true },
  thana: { type: String, required: true },
  fullAddress: { type: String, required: true },
  notes: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingCharge: {
      type: Number,
      default: 120,
    },
    shippingAddress: shippingAddressSchema,
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],
      default: 'Pending',
    },
    deliveryStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentGatewayResponse: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        return ret;
      },
    },
  }
);

export default mongoose.model('Order', orderSchema);
