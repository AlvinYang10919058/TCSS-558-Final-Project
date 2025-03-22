import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import redis from './configs/redis.js';
import {orderConsumer} from "./configs/kafka.js";
import OrderModel from "./models/Order.js";
import connectDB from "./configs/db.js";

const paymentServiceURL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002'; // http://payment-service:4002/payment

const app = express();
app.use(express.json());
connectDB();

// Create Order and Start Saga
app.post('/order', async (req, res) => {
    const orderId = Date.now().toString();

    const order = {orderId, price: 10};
    await redis.set(orderId, JSON.stringify(order));

    try {
        await axios.post(`${paymentServiceURL}/payment`, {orderId});
        res.json({message: 'Order created, Payment started', orderId});
    } catch (error) {
        console.error('Payment failed:', error);
        res.status(200).json({error: `Payment failed, orderId: ${orderId}`});
    }
});

const listenToTopic = async () => {
    await orderConsumer.connect();
    await orderConsumer.subscribe({topic: 'shipment-success', fromBeginning: true});
    await orderConsumer.subscribe({topic: 'payment-failed', fromBeginning: true});

    async function saveOrder(rawOrder, orderId) {
        if (rawOrder) {
            const order = new OrderModel({id: orderId, price: JSON.parse(rawOrder).price});
            await order.save();
            console.log(`Order ${orderId} completed.`);
            await redis.del(orderId);
        } else {
            console.log('Cannot find order with id ' + orderId);
        }
    }

    async function rollbackOrder(orderId) {
        await redis.del(orderId);
        console.log(`delete order ${orderId} because of payment failed`);
    }

    await orderConsumer.run({
        eachMessage: async ({topic, message}) => {
            const { orderId } = JSON.parse(message.value.toString());
            const rawOrder = await redis.get(orderId);
            console.log(`read order form topic ${orderId}, rawOrder: ${JSON.stringify(rawOrder)}`);

            switch (topic) {
                case 'shipment-success':
                    await saveOrder(rawOrder, orderId);
                    break;
                case 'payment-failed':
                    await rollbackOrder(orderId);
                    break;
                default:
                    console.log(`Received message from unknown topic ${topic}:`, value);
            }
        },
    });
};

listenToTopic();

app.listen(4001, () => console.log('Order service running on port 4001'));