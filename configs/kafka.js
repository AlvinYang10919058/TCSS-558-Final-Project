import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'my-app',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
});

const producer = kafka.producer();
const orderConsumer = kafka.consumer({ groupId: 'order-group' });
const paymentConsumer = kafka.consumer({ groupId: 'payment-group' });


async function checkConnection() {
    try {
        await producer.connect();
        console.log('Producer connected successfully.');
        return true;
    } catch (error) {
        console.error('Failed to connect producer:', error);
        return false;
    }
}

await checkConnection();

export { kafka, producer, orderConsumer, paymentConsumer };
