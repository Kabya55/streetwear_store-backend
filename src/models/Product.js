import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price in BDT (৳) is required'],
      min: [0, 'Price must be positive'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    images: {
      type: [String],
      required: [true, 'At least one product image is required'],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Product must contain at least one image URL',
      },
    },
    sizes: {
      type: [String],
      default: ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
    },
    colors: {
      type: [String],
      default: ['Phantom Black', 'Crimson Red', 'Ghost White'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    deliveryCharge: {
      type: Number,
      default: 120,
      min: 0,
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

// Search indexing for high performance
productSchema.index({ title: 'text', description: 'text', category: 1 });

export default mongoose.model('Product', productSchema);
