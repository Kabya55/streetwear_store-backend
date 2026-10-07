import Product from '../models/Product.js';
import Category from '../models/Category.js';

export const getProducts = async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice, featured } = req.query;
    const filter = {};

    if (category && category !== 'all') {
      const sanitizedCat = category.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.category = { $regex: new RegExp(`^${sanitizedCat}$`, 'i') };
    }

    if (search && search.trim()) {
      const sanitized = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const { size, inStock } = req.query;
    if (size && size !== 'all') {
      filter.sizes = size;
    }

    if (inStock === 'true') {
      filter.stock = { $gt: 0 };
    }

    if (featured === 'true') {
      filter.featured = true;
    }

    let query = Product.find(filter);

    if (sort === 'price-asc') {
      query = query.sort({ price: 1 });
    } else if (sort === 'price-desc') {
      query = query.sort({ price: -1 });
    } else if (sort === 'oldest') {
      query = query.sort({ createdAt: 1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const products = await query.exec();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Streetwear item not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock, images, image, sizes, colors, featured, deliveryCharge } = req.body;

    // Normalize images array from array, string, or comma-separated values
    let imageList = [];
    if (Array.isArray(images)) {
      imageList = images
        .map((img) => (typeof img === 'string' ? img.trim() : ''))
        .filter((img) => img.length > 0);
    } else if (typeof images === 'string' && images.trim()) {
      imageList = images.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    } else if (typeof image === 'string' && image.trim()) {
      imageList = image.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    }

    if (!imageList.length) {
      imageList = ['https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&q=80&w=900'];
    }

    const categorySlug = (category || 'men').toLowerCase().trim();

    if (categorySlug && !['men', 'women', 'kids'].includes(categorySlug)) {
      const catName = categorySlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      await Category.findOneAndUpdate(
        { slug: categorySlug },
        { name: catName, slug: categorySlug },
        { upsert: true, new: true }
      ).catch(() => {});
    }

    const product = await Product.create({
      title: (title || '').trim(),
      description: (description || '').trim(),
      price: Number(price),
      category: categorySlug,
      stock: Number(stock),
      images: imageList,
      sizes: sizes && sizes.length ? sizes : ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
      colors: colors || ['Phantom Black', 'Crimson Red'],
      featured: Boolean(featured),
      deliveryCharge: deliveryCharge !== undefined && deliveryCharge !== '' ? Number(deliveryCharge) : 120,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.deliveryCharge !== undefined && updateData.deliveryCharge !== '') {
      updateData.deliveryCharge = Number(updateData.deliveryCharge);
    }

    if (updateData.images) {
      if (typeof updateData.images === 'string') {
        updateData.images = updateData.images
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
      } else if (Array.isArray(updateData.images)) {
        updateData.images = updateData.images
          .map((s) => (typeof s === 'string' ? s.trim() : ''))
          .filter((s) => s.length > 0);
      }
      if (!updateData.images.length) {
        delete updateData.images; // preserve previous images if empty
      }
    }

    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price);
    }
    if (updateData.stock !== undefined) {
      updateData.stock = Number(updateData.stock);
    }
    if (updateData.category) {
      updateData.category = updateData.category.toLowerCase().trim();
      if (!['men', 'women', 'kids'].includes(updateData.category)) {
        const catName = updateData.category
          .split(/[-_ ]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        await Category.findOneAndUpdate(
          { slug: updateData.category },
          { name: catName, slug: updateData.category },
          { upsert: true, new: true }
        ).catch(() => {});
      }
    }
    if (updateData.title) {
      updateData.title = updateData.title.trim();
    }
    if (updateData.description) {
      updateData.description = updateData.description.trim();
    }

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product removed from catalog successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const savedCategories = await Category.find().sort({ name: 1 }).lean();
    const productCategories = await Product.distinct('category');

    const map = new Map();

    // Default 3 standard streetwear categories
    map.set('men', { id: 'men', name: 'Men Footwear', slug: 'men' });
    map.set('women', { id: 'women', name: 'Women Footwear', slug: 'women' });
    map.set('kids', { id: 'kids', name: 'Junior / Kids', slug: 'kids' });

    // Custom categories explicitly registered in Category collection
    savedCategories.forEach((c) => {
      const slug = (c.slug || c.name).toLowerCase().trim();
      map.set(slug, {
        id: slug,
        name: c.name,
        slug: slug,
      });
    });

    // Custom categories present on products in database
    productCategories.forEach((cat) => {
      if (!cat) return;
      const slug = cat.toLowerCase().trim();
      if (!map.has(slug)) {
        const name = slug
          .split(/[-_ ]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        map.set(slug, {
          id: slug,
          name,
          slug,
        });
      }
    });

    res.json(Array.from(map.values()));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const cleanName = name.trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) {
      return res.status(400).json({ message: 'Invalid category name' });
    }

    let category = await Category.findOne({ slug });
    if (!category) {
      category = await Category.create({ name: cleanName, slug });
    }

    res.status(201).json({
      id: category.slug,
      name: category.name,
      slug: category.slug,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getProductFilters = async (req, res) => {
  try {
    // 1. Category aggregation with product count
    const categoryCounts = await Product.aggregate([
      {
        $group: {
          _id: { $toLower: { $ifNull: ['$category', ''] } },
          count: { $sum: 1 },
        },
      },
    ]);
    const savedCategories = await Category.find().sort({ name: 1 }).lean();
    const totalProducts = await Product.countDocuments();

    // 2. Price Min & Max aggregation
    const priceStats = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
    ]);

    // 3. Unique Sizes from MongoDB
    const sizesAgg = await Product.distinct('sizes');
    const validSizes = sizesAgg.filter(Boolean).sort();

    // 4. In-stock count
    const inStockCount = await Product.countDocuments({ stock: { $gt: 0 } });

    // Build category map with live counts from DB
    const countMap = new Map();
    categoryCounts.forEach((c) => {
      if (c._id) countMap.set(String(c._id).toLowerCase(), c.count);
    });

    const categoryMap = new Map();
    // Standard streetwear defaults
    categoryMap.set('men', { id: 'men', name: 'Men Footwear', slug: 'men', count: countMap.get('men') || 0 });
    categoryMap.set('women', { id: 'women', name: 'Women Footwear', slug: 'women', count: countMap.get('women') || 0 });
    categoryMap.set('kids', { id: 'kids', name: 'Junior / Kids', slug: 'kids', count: countMap.get('kids') || 0 });

    // Saved in Category collection
    savedCategories.forEach((sc) => {
      const slug = (sc.slug || sc.name).toLowerCase().trim();
      categoryMap.set(slug, {
        id: slug,
        name: sc.name,
        slug,
        count: countMap.get(slug) || 0,
      });
    });

    // Any category present in Product documents
    categoryCounts.forEach((cc) => {
      if (!cc._id) return;
      const slug = String(cc._id).toLowerCase().trim();
      if (!categoryMap.has(slug)) {
        const name = slug
          .split(/[-_ ]+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        categoryMap.set(slug, {
          id: slug,
          name,
          slug,
          count: cc.count,
        });
      }
    });

    res.json({
      totalProducts,
      inStockCount,
      minPrice: priceStats[0]?.minPrice || 0,
      maxPrice: priceStats[0]?.maxPrice || 50000,
      categories: Array.from(categoryMap.values()),
      sizes: validSizes.length ? validSizes : ['EU 37', 'EU 38', 'EU 39', 'EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44'],
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
