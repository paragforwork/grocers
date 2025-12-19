const {Order,Product}=require('../models/schema');
const jwt = require('jsonwebtoken');

exports.createOrder=async(req,res)=>{
    try {
        const {items,shippingInfo,paymentInfo}=req.body;
        const token =req.cookies.accessToken;
        if(!token){
            return res.status(401).json({success:false,message:"Unauthorized"});
        }
        const decoded=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const userId=decoded._id;
        let totalAmount=0;
        const finalItemsList=[];

        for(const item of items){
            const productDoc =await Product.findById(item.product);
            if(!productDoc){
                return res.status(404).json({success:false,message:`Product with ID ${item.product} not found`});
            }
            const cost=productDoc.price * item.quantity;
            totalAmount+=cost;
            finalItemsList.push({
                product:productDoc._id,
                quantity:item.quantity,
                priceatpurchase:productDoc.price
            });

        }
        const newOrder=new Order({
            user: userId,
            items: finalItemsList,
            totalAmount: totalAmount,
            shippingInfo: shippingInfo,
            paymentInfo: {
            method: paymentMethod, // 'COD' or 'Online'
            status: paymentMethod === 'COD' ? 'Pending' : 'Paid'}
        });

         await newOrder.save();
        res.status(201).json({
            success:true,
            message:"Order created successfully",
            order:newOrder._id
        })
        
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).json({ message: "Failed to place order" });
    }


};
 exports.getmyOrders=async(req,res)=>{
    try {
        const token =req.cookies.accessToken;
        if(!token){
            return res.status(401).json({success:false,message:"Unauthorized"});
        }
        const decoded=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);

        const orders=await Order.find({user:decoded._id}).populate('items.product').sort({createdAt:-1});
        res.json({success:true,orders:orders});
    } catch (error) {
        res.status(500).json({ message: "Error fetching history" });
    }
 };

