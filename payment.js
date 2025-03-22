import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import redis from './configs/redis.js';
import { producer, paymentConsumer } from "./configs/kafka.js";
import connectDB from "./configs/db.js";
import PaymentModel from "./models/Payment.js";

const shipmentServiceURL = process.env.SHIPMENT_SERVICE_URL || 'http://localhost:4003'; // http://shipment-service:4003/shipment

const app = express();
app.use(express.json());
connectDB();

app.post('/payment', async (req, res) => {
    const { orderId } = req.body;
    console.log(`Processing payment for order ${orderId}`);

    const paymentSuccess = true;
    try {
        // ... simulate processing payment
        if (!paymentSuccess) {
            throw "Payment failed for reasons";
        }

        const payment =  { orderId, method: 'Cash'};
        await redis.set(`payment:${orderId}`, JSON.stringify(payment));

        await axios.post(`${shipmentServiceURL}/shipment`, { orderId });
        res.json({ message: 'Payment processed, Shipment started', orderId });
    } catch (error) {
        console.log(`payment-failed, orderId=${orderId} error=${error}`);
        await producer.send({
            topic: 'payment-failed',
            messages: [{value: JSON.stringify({orderId})}],
        });

        console.error('Shipment failed:', error);
        res.status(500).json({ error: 'Shipment failed' });
    }
});

// Listen to Shipment Completion from Kafka
const listenForShipment = async () => {
    await paymentConsumer.connect();
    await paymentConsumer.subscribe({ topic: 'shipment-success', fromBeginning: true });

    await paymentConsumer.run({
        eachMessage: async ({ message }) => {
            const { orderId } = JSON.parse(message.value.toString());
            const rawPayment = await redis.get(`payment:${orderId}`);
            console.log(`read payment form topic ${orderId}, rawPayment: ${JSON.stringify(rawPayment)}`);

            if (rawPayment) {
                const payment = new PaymentModel({ orderId, method: JSON.parse(rawPayment).method});
                await payment.save();
                console.log(`Payment ${orderId} completed.`);
                await redis.del(`payment:${orderId}`);
            } else {
                console.log('Cannot find payment with id ' + orderId);
            }

        },
    });
};

listenForShipment();

app.listen(4002, () => console.log('Payment service running on port 4002'));
