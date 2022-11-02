import asyncHandler from "express-async-handler";
import Product from "../models/productModel.js";

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
    : {};

  const products = await Product.find({
    ...keyword,
    remainingQuantity: { $gt: 0 },
  });

  res.json(products);
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    if (JSON.stringify(req.user._id) === JSON.stringify(product.user)) {
      //await product.remove()
      product.status = "Cancelled";
      product.remainingQuantity = 0;
      await product.save();
      res.json({ message: "Product removed" });
    } else {
      res.status(404);
      throw new Error(`You are not the owner of this product.`);
    }
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = asyncHandler(async (req, res) => {
  //initialises the values of the product to random values, and we edit this immediately
  const product = new Product({
    name: "Sample name",
    price: 0,
    user: req.user._id,
    image: "/images/sample.jpg",
    bundleQuantity: 0,
    numReviews: 0,
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, image, bundleQuantity, remainingQuantity } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    if (JSON.stringify(req.user._id) === JSON.stringify(product.user)) {
      product.name = name;
      product.price = price;
      product.image = image;
      product.bundleQuantity = bundleQuantity;
      product.remainingQuantity = remainingQuantity;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error(`You are not the owner of this product.`);
    }
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Get logged in vendor's waitlist products
// @route   GET /api/products/mywaitingproducts
// @access  Private/Admin
const getMyWaitlistProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    user: req.user._id,
    remainingQuantity: { $gt: 0 },
    status: { $ne: "Cancelled" },
  });
  res.json(products);
});

// @desc    Get logged in vendor's dispatch ready products
// @route   GET /api/products/dispatchready
// @access  Private/Admin
const getDispatchReadyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    user: req.user._id,
    remainingQuantity: 0,
    status: "Placed",
  });
  res.json(products);
});

// @desc    Get logged in vendor's dispatched products
// @route   GET /api/products/dispatched
// @access  Private/Admin
const getDispatchedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    user: req.user._id,
    status: "Dispatched",
  });
  res.json(products);
});

// @desc    Update product status to dispatched
// @route   PUT /api/products/dispatchProduct/:id
// @access  Private/Admin
const dispatchProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  console.log("sss");
  if (product) {
    product.status = "Dispatched";
    const updatedProduct = await product.save();

    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

export {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getMyWaitlistProducts,
  getDispatchReadyProducts,
  dispatchProduct,
  getDispatchedProducts,
};
