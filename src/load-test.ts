import axios from 'axios';
import performance from 'performance-now';

async function sendRequests(url: string, totalRequests: number) {
  const requests: Promise<any>[] = [];
  const latencies: number[] = [];
  let successfulRequests = 0;

  const startTime = performance();

  for (let i = 0; i < totalRequests; i++) {
    const requestStart = performance();
    requests.push(
      axios.post(url).then(() => {
        successfulRequests++;
        const latency = performance() - requestStart;
        latencies.push(latency);
      })
    );
  }

  await Promise.allSettled(requests);

  const endTime = performance();
  const totalTime = endTime - startTime;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

  console.log(`Total requests: ${totalRequests}`);
  console.log(`Successful requests: ${successfulRequests}`);
  console.log(`Failed requests: ${totalRequests - successfulRequests}`);
  console.log(`Total time: ${totalTime / 1000} seconds`);
  console.log(`Throughput: ${successfulRequests / (totalTime / 1000)} requests per second`);
  console.log(`Average latency: ${avgLatency / 1000} seconds`);
}

const apiUrl = 'http://localhost:3000/enqueue';
const numRequests = 10000;

sendRequests(apiUrl, numRequests);
