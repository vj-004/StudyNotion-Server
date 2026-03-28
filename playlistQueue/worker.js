import { Worker } from "bullmq";

const sendEmail = (ms) => new Promise((res,rej) => setTimeout(() => res(), ms * 1000));


const work = async (job) => {

    

}

const worker = new Worker('playlist-queue', (job) => work(job), {
    connection:{
        host: '127.0.0.1',
        port: 6379
    }
});