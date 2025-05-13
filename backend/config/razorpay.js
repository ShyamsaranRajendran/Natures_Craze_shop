const Razorpay = require('razorpay');

module.exports = new Razorpay({
  key_id: "rzp_test_814EkXmD14BWDD" ||process.env.RAZORPAY_KEY_ID ,
  key_secret: "tDGkmo8xCjbbEDG2kBSucvmB"||process.env.RAZORPAY_KEY_SECRET,
});