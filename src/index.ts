import express, { Request, Response } from 'express'
import { Queue, Worker, Job, QueueEvents, ConnectionOptions } from 'bullmq'

const app = express()
app.use(express.json())

const queueName = 'process'

// Define as opções de conexão Redis
const redisConnectionOptions: ConnectionOptions = {
    host: 'localhost',
    port: 6379,
}

// Cria uma instância da fila
const queue = new Queue(queueName, { connection: redisConnectionOptions })

// Cria uma instância do worker
const worker = new Worker(queueName, async (job: Job) => {
    console.log(`Processing job ${job.id}`)
    // Simula um processamento longo
    await new Promise(resolve => setTimeout(resolve, 5000))
    console.log(`Completed job ${job.id}`)
}, { connection: redisConnectionOptions })

// Obtém o número de processadores disponíveis na instância
const numProcessors = require('os').cpus().length

// Cria várias instâncias do worker, uma por processador
const workers: Worker[] = []
for (let i = 0 ; i < numProcessors; i++) {
    const worker = new Worker(queueName, async (job: Job) => {
        console.log(`Processing job ${job.id} on processor ${i + 1}`)
        // Simula um processamento longo
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log(`Completed job ${job.id}`)
    }, {
        connection: redisConnectionOptions,
        concurrency: 1, // Processa apenas um trabalho por vez
    })
    workers.push(worker)
}

// Cria uma instância do QueueEvents
const queueEvents = new QueueEvents(queueName, { connection: redisConnectionOptions })

// Listener para quando um trabalho é concluído
worker.on('completed', (job: Job) => {
    console.log(`Job ${job.id} has been completed`)
})

// Evento "failed" é disparado quando um trabalho falha
worker.on('failed', async (job: Job<any, any, string> | undefined, error: Error) => {
    try {
        if (job) {
            // Armazene as informações do trabalho falho no banco de dados
            const jobFailure = {
                jobId: job.id,
                data: job.data,
                error: error.message,
                timestamp: new Date(),
            }

            // Código para salvar as informações em um banco de dados
            // Exemplo: usando um ORM como o TypeORM ou uma conexão direta com o banco de dados

            console.log('Job failed:', jobFailure)
        } else {
            console.log('Job failed with undefined job:', error)
        }
    } catch (error) {
        console.error('Error saving failed job information:', error)
    }
})

// Rota para enfileirar um trabalho
app.post('/enqueue', async (req: Request, res: Response) => {
    try {
        const job = await queue.add('process', {}, {
            attempts: 5, // número máximo de tentativas permitidas
            backoff: {
                type: 'exponential', // estratégia de backoff exponencial
                delay: 5000, // intervalo de tempo entre as tentativas (em milissegundos)
            },
            removeOnFail: false, // manter o trabalho na fila após falhar
            removeOnComplete: true, // remover o trabalho da fila após ser concluído
        })

        console.log(`Job enqueued with ID: ${job.id}`)
        res.json({ message: 'Job enqueued' })
    } catch (error) {
        console.error('Error enqueueing job:', error)
        res.status(500).json({ error: 'Error enqueueing job' })
    }
})

app.post('/enqueue2', async (req: Request, res: Response) => {
    try {
        // Simula um processamento longo
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log(`Job completed`)
        res.json({ message: 'Job completed' })
    } catch (error) {
        console.error('Error completing job:', error)
        res.status(500).json({ error: 'Error completing job' })
    }
})


app.listen(3000, () => {
    console.log('Server is running on port 3000')
})
