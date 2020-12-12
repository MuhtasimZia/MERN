const router = require("express").Router();
const productCtrl = require("../controllers/productCtrl");
const auth = require("../middleware/auth");
const authAdmin = require("../middleware/authAdmin");
var Products = require("../models/productModel");

var fs = require("fs");
var path = require("path");
var multer = require("multer");

//image
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + ".png");
  },
});

var upload = multer({ storage: storage });

router.route("/products").get(productCtrl.getProducts);
// .post(auth, authAdmin, productCtrl.createProduct)

router.route("/products/:id").delete(auth, authAdmin, productCtrl.deleteProduct);
//     .put(auth, authAdmin, productCtrl.updateProduct)

//auth, authAdmin
router.post("/products", upload.single("image"), async (req, res) => {
  try {
    var img = fs.readFileSync(req.file.path);
    // var encode_image = img.toString("base64");

    var { product_id, title, price, description, category, stock } = req.body;

    var product = await Products.findOne({ product_id });
    if (product) return res.status(400).json({ msg: "This product already exists." });

    var newProduct = new Products({
      product_id,
      title: title.toLowerCase(),
      price,
      description,
      category,
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
});

//auth, authAdmin
router.put("/products/:id", upload.single("image"), async (req, res) => {
  try {
    var img = fs.readFileSync(req.file.path);
    var { title, price, description, category, stock, is_dlt } = req.body;

    await Products.findOneAndUpdate(
      { _id: req.params.id },
      {
        title: title.toLowerCase(),
        price,
        description,
        category,
        img: {
          // data: new Buffer(encode_image, "base64"), DEPRECATED
          // data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.file.filename)), ERROR
          data: img,
          contentType: "image/png",
        },
        stock,
        is_dlt,
      }
    );

    res.json({ msg: "Updated a Product" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
