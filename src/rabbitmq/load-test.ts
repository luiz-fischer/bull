import amqp, { ConfirmChannel } from 'amqplib';

async function main() {
  const numMessages = 10; // Altere o valor para o número desejado de mensagens

  await publishMessagesToRabbitMQ(numMessages);
}

main().catch((error) => console.error('Error:', error));

async function publishMessagesToRabbitMQ(numMessages: number) {
  try {
    const rabbitMQConfig = {
      protocol: 'amqp',
      hostname: 'localhost',
      port: 5672,
      username: 'guest',
      password: 'guest',
    };

    const connection = await amqp.connect(rabbitMQConfig);
    const channel = await connection.createConfirmChannel() as ConfirmChannel;
    await channel.assertQueue('process');

    for (let i = 1; i <= numMessages; i++) {
      const message = {
        id: i,
        content: `Message ${i}`,
      };
      const messageContent = JSON.stringify(message);
      channel.sendToQueue('process', Buffer.from(messageContent));

      await channel.waitForConfirms(); // Aguarda a confirmação da mensagem

      console.log('Message published to RabbitMQ:', messageContent);
    }

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error publishing messages to RabbitMQ:', error);
  }
}
