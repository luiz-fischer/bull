import express, { Request, Response } from 'express'
import Queue, { QueueOptions } from 'bull'
import amqp from 'amqplib'

const app = express()
app.use(express.json())

const rabbitMQConfig = {
  protocol: 'amqp',
  hostname: 'localhost',
  port: 5672,
  username: 'guest',
  password: 'guest',
}

const processQueue = new Queue('process', {
  redis: {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: 1,
  } as QueueOptions['redis'],
})

processQueue.process(async (job) => {
  console.log(`Processing job ${job.id}`)

  try {
    // Simula um processamento de mensagem
    if (Math.random() < 0.5) {
      throw new Error('Failed processing')
    }
    await new Promise((resolve) => setTimeout(resolve, 5000))

    console.log(`Completed job ${job.id}`)
    return {} // O retorno é necessário para o ack no Bull
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error)

    throw error
  }
})

processQueue.on('completed', async (job) => {
  console.log(`Job ${job.id} has been completed`)

  // Remover o trabalho completado do Redis
  await job.remove()
})

processQueue.on('failed', async (job, error) => {
  try {
    const jobFailure = {
      jobId: job.id,
      data: job.data,
      error: error.message,
      timestamp: new Date(),
    }

    console.log('Job failed:', jobFailure)

    // Mover o trabalho para a lista de trabalhos falhados do Bull
    await job.moveToFailed(error, true)

    // Mover a mensagem de volta para a fila do RabbitMQ
    const connection = await amqp.connect(rabbitMQConfig)
    const channel = await connection.createChannel()
    await channel.assertQueue('process')
    channel.sendToQueue('process', Buffer.from(JSON.stringify(job.data)))

    console.log('Message sent back to RabbitMQ:', job.data)

    // Acknowledge the message
    processQueue.getJob(job.id).then((job) => {
      if (job) {
        job.remove()
      }
    })
  } catch (error) {
    console.error('Error:', error)
  }
})

async function consumeMessagesFromRabbitMQ() {
  try {
    const connection = await amqp.connect(rabbitMQConfig)
    const channel = await connection.createChannel()
    await channel.assertQueue('process')

    console.log('Aguardando mensagens na fila do RabbitMQ...')

    channel.consume('process', async (msg) => {
      if (msg !== null) {
        const messageContent = msg.content.toString()
        try {
          await processQueue.add(JSON.parse(messageContent), {
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnFail: false,
          })

          console.log('Message processed: ', messageContent)
        } catch (error) {
          console.error('Error processing message: ', error)
        } finally {
          channel.ack(msg) // Acknowledge the message
        }
      }
    })
  } catch (error) {
    console.error('Erro ao consumir mensagens do RabbitMQ:', error)
  }
}

consumeMessagesFromRabbitMQ()

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
