import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
    orderId: String,
    shipDate: Date
}, { timestamps: true });

const ShipmentModel = mongoose.model('Shipment', shipmentSchema);
export default ShipmentModel;