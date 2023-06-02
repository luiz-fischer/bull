import axios from 'axios';

async function sendRequests(url: string, totalRequests: number) {
  const requests: Promise<any>[] = [];
  for (let i = 0; i < totalRequests; i++) {
    requests.push(axios.post(url));
  }

  try {
    const responses = await Promise.all(requests);
    console.log(`Total requests: ${totalRequests}`);
    console.log(`Successful requests: ${responses.length}`);
    console.log(`Failed requests: ${totalRequests - responses.length}`);
  } catch (error) {
    console.error('Error sending requests:', error);
  }
}

const apiUrl = 'http://localhost:3000/enqueue'; // substitua pela URL correta da sua API
const numRequests = 100; // número total de solicitações a serem enviadas

sendRequests(apiUrl, numRequests);
