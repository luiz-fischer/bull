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

// Evento "failed" é disparado quando um job falha
processQueue.on('failed', async (job, error) => {
    try {
        // Armazene as informações do job falho no banco de dados
        const jobFailure = {
            jobId: job.id,
            data: job.data,
            error: error.message,
            timestamp: new Date(),
        };

        // Código para salvar as informações em um banco de dados
        // Exemplo: usando um ORM como o TypeORM ou uma conexão direta com o banco de dados

        console.log('Job falho:', jobFailure);
    } catch (error) {
        console.error('Erro ao salvar informações do job falho:', error);
    }
});

const app = express();
app.use(bodyParser.json());

// Rota para enfileirar um trabalho
app.post('/enqueue', (req: Request, res: Response) => {
    processQueue.add({}, {
        attempts: 5, // número máximo de tentativas permitidas
        backoff: {
            type: 'exponential', // estratégia de backoff exponencial
            delay: 5000, // intervalo de tempo entre as tentativas (em milissegundos)
        },
        removeOnFail: false, // manter o job na fila após falhar
    });
    res.json({ message: 'Job enqueued' });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
