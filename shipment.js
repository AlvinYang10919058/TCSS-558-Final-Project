import 'dotenv/config';
import express from 'express';
import { producer } from "./configs/kafka.js";
import connectDB from "./configs/db.js";
import ShipmentModel from "./models/Shipment.js";

const app = express();
app.use(express.json());
connectDB();

app.post('/shipment', async (req, res) => {
    const {orderId} = req.body;
    console.log(`Processing shipment for order ${orderId}`);

    const shipment = new ShipmentModel({ orderId, shipDate: getShipDate() });
    await shipment.save();

    console.log(`Shipment finished successfully, publishing message.`);
    // Simulate shipment success
    await producer.send({
        topic: 'shipment-success',
        messages: [{value: JSON.stringify({orderId})}],
    });

    console.log(`Shipment ${orderId} completed.`);
    res.json({message: 'Shipment completed', orderId});
});

function getShipDate() {
    const date = new Date();
    date.setDate(date.getDate() + 5); // simulate the shipping date is the day plus 5 days after revicing the order

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

app.listen(4003, () => console.log('Shipment service running on port 4003'));
