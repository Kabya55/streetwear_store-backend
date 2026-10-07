import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Setting from '../models/Setting.js';

// Calculate totals & delivery charges for all products on the backend
export const calculateCart = async (req, res) => {
  try {
    const { items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({
        subtotal: 0,
        totalDeliveryCharge: 0,
        grandTotal: 0,
        itemCount: 0,
        items: [],
      });
    }

    let defaultCharge = 120;
    try {
      const setting = await Setting.findOne({ key: 'store_settings' });
      if (setting && setting.deliveryCharge !== undefined) {
        defaultCharge = Number(setting.deliveryCharge);
      }
    } catch (e) {}

    let subtotal = 0;
    let totalDeliveryCharge = 0;
    let itemCount = 0;
    const calculatedItems = [];

    for (const item of items) {
      const productId = item.product || item._id || item.id;
      let dbProduct = null;
      if (productId) {
        try {
          dbProduct = await Product.findById(productId);
        } catch (e) {}
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = dbProduct ? Number(dbProduct.price) : Number(item.price) || 0;
      const deliveryCharge =
        dbProduct && dbProduct.deliveryCharge !== undefined
          ? Number(dbProduct.deliveryCharge)
          : item.deliveryCharge !== undefined
          ? Number(item.deliveryCharge)
          : defaultCharge;

      const itemSubtotal = price * qty;
      // Delivery charge is per product line (not multiplied by quantity)
      const itemDeliveryTotal = deliveryCharge;

      subtotal += itemSubtotal;
      totalDeliveryCharge += itemDeliveryTotal;
      itemCount += qty;

      calculatedItems.push({
        product: productId,
        title: dbProduct ? dbProduct.title : item.title || '',
        price,
        quantity: qty,
        selectedSize: item.selectedSize || 'EU 42',
        image: (dbProduct && dbProduct.images?.[0]) || item.image || '',
        deliveryCharge,
        deliveryTotal: itemDeliveryTotal,
        itemSubtotal,
      });
    }

    const grandTotal = subtotal + totalDeliveryCharge;

    res.json({
      subtotal,
      totalDeliveryCharge,
      grandTotal,
      itemCount,
      items: calculatedItems,
    });
  } catch (error) {
    console.error('[Calculate Cart Error]', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user cart from MongoDB with backend-calculated totals
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.product');
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }
    const cartObj = cart.toObject();
    let subtotal = 0;
    let totalDeliveryCharge = 0;

    if (Array.isArray(cartObj.items)) {
      cartObj.items = cartObj.items.map((item) => {
        const prod = item.product;
        const currentPrice =
          prod && prod.price !== undefined ? Number(prod.price) : Number(item.price) || 0;
        const currentDelivery =
          prod && typeof prod === 'object' && prod.deliveryCharge !== undefined
            ? Number(prod.deliveryCharge)
            : item.deliveryCharge !== undefined
            ? Number(item.deliveryCharge)
            : 120;
        const qty = Number(item.quantity) || 1;
        subtotal += currentPrice * qty;
        // Delivery charge is once per product line (not multiplied by quantity)
        totalDeliveryCharge += currentDelivery;

        return {
          ...item,
          product: prod && prod._id ? prod._id.toString() : item.product,
          price: currentPrice,
          deliveryCharge: currentDelivery,
          deliveryTotal: currentDelivery * qty,
          itemSubtotal: currentPrice * qty,
        };
      });
    }

    cartObj.subtotal = subtotal;
    cartObj.totalDeliveryCharge = totalDeliveryCharge;
    cartObj.grandTotal = subtotal + totalDeliveryCharge;

    res.json(cartObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Sync entire cart from frontend (e.g. after login or batch update)
export const syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    if (Array.isArray(items)) {
      cart.items = items;
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add item to cart in MongoDB
export const addToCart = async (req, res) => {
  try {
    const { product: productId, title, price, quantity = 1, selectedSize = 'EU 42', image } = req.body;

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    // Verify product price & details from database
    const dbProduct = await Product.findById(productId);
    const verifiedPrice = dbProduct ? dbProduct.price : price;
    const verifiedTitle = dbProduct ? dbProduct.title : title;
    const verifiedImage = dbProduct && dbProduct.images?.[0] ? dbProduct.images[0] : image;
    const verifiedDelivery =
      dbProduct && dbProduct.deliveryCharge !== undefined ? Number(dbProduct.deliveryCharge) : 120;

    const existingIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.selectedSize === selectedSize
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
      cart.items[existingIndex].deliveryCharge = verifiedDelivery;
    } else {
      cart.items.push({
        product: productId,
        title: verifiedTitle,
        price: verifiedPrice,
        quantity: Number(quantity),
        selectedSize,
        image: verifiedImage,
        deliveryCharge: verifiedDelivery,
      });
    }

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update item quantity or size in MongoDB
export const updateCartItem = async (req, res) => {
  try {
    const { product: productId, selectedSize, newQuantity, newSize } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.selectedSize === selectedSize
    );

    if (itemIndex > -1) {
      if (newQuantity !== undefined) {
        if (Number(newQuantity) <= 0) {
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = Number(newQuantity);
        }
      }
      if (newSize) {
        cart.items[itemIndex].selectedSize = newSize;
      }
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item from cart in MongoDB
export const removeCartItem = async (req, res) => {
  try {
    const { productId, selectedSize } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === productId && item.selectedSize === selectedSize)
    );

    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear entire cart in MongoDB
export const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
