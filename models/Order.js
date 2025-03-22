import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    id: String,
    price: Number
}, { timestamps: true });

const OrderModel = mongoose.model('Order', orderSchema);
export default OrderModel;