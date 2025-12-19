const mongoose = require("mongoose")

const productschema = new mongoose.Schema({
    
    name:String,
    price:Number,
    description: String,
    image:String,
} );

//cart schema
const cartSchema =new mongoose.Schema({
    user:{
        type:mongoose.Schema.ObjectId,
        ref:'User',
        required:true
    },
   items:[
    {
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true

        },
        quantity:{
            type:Number,
            default:1,
             min:1
         }
        
    }
   ]
},{
    timestamps:true
});
// user schema

const userschema = new mongoose.Schema({
    
    email: {
        type: String,
        required: true,
        unique: true 
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
      
        default: null 
    },

    
    address: {
        type: String,
        default: "" // Stores House No, Street Name
    },
    city: {
        type: String,
        default: "" // Stores City Name (Needed for Order Schema)
    },
    postalCode: {
        type: String,
        default: "" // Stores Pincode (Needed for Order Schema)
    },

    refreshtoken: {
        type: String
    }
});

const User =mongoose.model('User',userschema)

// comment schema
const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
}, {
    timestamps: true
});


const orderSchema =new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },items:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true},
        quantity:{
            type:Number,
            default:1,
            min:1
        },
        priceatpurchase:{
            type:Number,
            required:true
        }
    }],
    shippingInfo:{
        fullname:{type:String,required:true},
        address:{type:String,required:true},
        city:{type:String,required:true},
        phone:{type:Number,required:true},
        postalcode:{type:String,required:true}, 
    },
    paymentInfo: {
        method: { 
            type: String, 
            enum: ['COD', 'Online'], 
            required: true 
        },
        // Store the Gateway ID (e.g., "pay_29384723") if paid online
        transactionId: { 
            type: String 
        },
        status: { 
            type: String, 
            enum: ['Pending', 'Paid', 'Failed'], 
            default: 'Pending' 
        }
    },
    totalAmount:{
        type:Number,
        required:true},
    orderStatus:{
        type:String,
        enum:['Processing','Shipped','Out for deleivery','Delivered','Cancelled'],
        default:'Processing'}

},{
    timestamps:true
});

const Comment = mongoose.model('Comment', commentSchema);

const Cart =mongoose.model('Cart',cartSchema);

const Product = mongoose.model('Product', productschema);

const Order =mongoose.model('Order',orderSchema);
module.exports = {
    Product,Cart,User,Comment,Order
}
