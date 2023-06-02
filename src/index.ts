import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import Queue, { QueueOptions } from 'bull';
import redis from 'redis';

// Crie a fila de trabalhos
const processQueue = new Queue('process', {
    redis: {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: 30, // Aumente o limite de tentativas para 30 (ou o valor desejado)
    } as QueueOptions['redis'],
});

// Defina o processador da fila
processQueue.process(async (job: Queue.Job) => {
    console.log(`Processing job ${job.id}`);
    // Simulate long and potentially failing processing
    if (Math.random() < 0.5) {
        throw new Error('Failed processing');
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log(`Completed job ${job.id}`);
});

// Listener para quando um trabalho foi concluído
processQueue.on('completed', (job: Queue.Job) => {
    console.log(`Job ${job.id} has been completed`);
});

// Listener para quando um trabalho falhou
processQueue.on('failed', (job: Queue.Job, error: Error) => {
    console.log(`Job ${job.id} failed with error ${error.message}`);
});

const app = express();
app.use(bodyParser.json());

// Rota para enfileirar um trabalho
app.post('/enqueue', (req: Request, res: Response) => {
    processQueue.add({}, {
        attempts: 5,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    });
    res.json({ message: 'Job enqueued' });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
