const Products = require("../models/productModel");

var fs = require("fs");

// Filter, sort and paginating
class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filtering() {
    const queryObj = { ...this.queryString }; //queryString = req.query

    const excludedFields = ["page", "sort", "limit"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte|regex)\b/g, (match) => "$" + match);

    //    gte = greater than or equal
    //    lte = lesser than or equal
    //    lt = lesser than
    //    gt = greater than
    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sorting() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 9;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

//only get, delete
const productCtrl = {
  getProducts: async (req, res) => {
    try {
      //   const features = new APIfeatures(Products.find(), req.query).filtering().sorting().paginating();
      const features = new APIfeatures(Products.find({ is_dlt: 1 }), req.query).filtering().paginating();

      const products = await features.query;

      res.json({
        status: "success",
        result: products.length,
        products: products,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  createProduct: async (req, res) => {
    try {
      var img = fs.readFileSync(req.file.path);
      // var encode_image = img.toString("base64");

      var { product_id, title, price, description, category, size, stock } = req.body;

      var product = await Products.findOne({ product_id });
      if (product) return res.status(400).json({ msg: "This product already exists." });

      var newProduct = new Products({
        product_id,
        title: title.toLowerCase(),
        price,
        description,
        category,
        size,
        img: {
          // data: new Buffer(encode_image, "base64"), DEPRECATED
          // data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.file.filename)), ERROR
          data: img,
          contentType: "image/png",
        },
        stock,
      });

      await newProduct.save();
      res.json({ msg: "Created a product" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  deleteProduct: async (req, res) => {
    try {
      await Products.findOneAndUpdate(
        { _id: req.params.id },
        {
          is_dlt: "2",
        }
      );
      res.json({ msg: "Deleted a Product" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  updateProduct: async (req, res) => {
    try {
      const { title, price, description, content, images, category } = req.body;
      if (!images) return res.status(400).json({ msg: "No image uploaded" });

      await Products.findOneAndUpdate(
        { _id: req.params.id },
        {
          title: title.toLowerCase(),
          price,
          description,
          content,
          images,
          category,
        }
      );

      res.json({ msg: "Updated a Product" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = productCtrl;
