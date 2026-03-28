import { Queue } from "bullmq";


const playlistQueue = new Queue('playlist-queue',{
    connection:{
        host: '127.0.0.1',
        port: 6379
    }
});

export const addPlaylistToQueue = async (jobDetails) => {

    const res = await playlistQueue.add('create Yt Course', jobDetails);
    console.log('res.id: ', res.id);

}

addPlaylistToQueue();



