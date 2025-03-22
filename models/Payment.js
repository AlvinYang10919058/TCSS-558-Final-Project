import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    orderId: String,
    method: String
}, { timestamps: true });

const PaymentModel = mongoose.model('Payment', paymentSchema);
export default PaymentModel;