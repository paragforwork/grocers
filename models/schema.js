const mongoose = require("mongoose")

const productschema = new mongoose.Schema({
    _id:Number,
    name:String,
    price:Number,
    description: String,
    image:String,
} );

//cart schema
const cartschema= new mongoose.Schema({
     _id: String,    //     "type": mongoose.Schema.Types.ObjectId,
    //     index: true,
    //     required: true,
    //     auto: true
    // },
    user:String,
    items:Array
});
// user schema

const userschema =new mongoose.Schema({
    //_id:Number,
    email:String,
    password:String,
    name:String,
    phone:Number,
    address:String,
    refreshtoken:{
        type:String
    }
});

const User =mongoose.model('User',userschema)

const Cart =mongoose.model('Cart',cartschema);

const Product = mongoose.model('Product', productschema);

module.exports = {
    Product,Cart,User
}