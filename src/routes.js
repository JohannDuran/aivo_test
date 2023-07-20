const {google} = require('googleapis');

const youtube = google.youtube({
    version: "v3",
    auth:process.env.APIKEY
});

async function searchV(search){
    try{
        if(!search){
            dataRespCode = {
                code: 400,
                message: "Null argument, required to do search",
                status: 'NULL_ARGUMENT',
            }
            return dataRespCode;
        }else{
            const response = await youtube.search.list({
                part:[
                    "snippet"
                ],
                q: search,
                maxResults: 10,
                type:"video",
            });

            return response.data;
        }
    }catch(error) {
        const err_resp = {
            code: error.response.data.error.code,
            message: error.response.data.error.message,
            status: error.response.data.error.status,
        };
        throw  err_resp;
    }
}

async function details(id){
    try{
        const response = await youtube.videos.list({
            part:[
                "statistics",
                "snippet",
                "contentDetails"
            ],
            id: id,
        });

        return response.data;
    }catch(error){
        const err_resp = {
            code: error.response.data.error.code,
            message: error.response.data.error.message,
            status: error.response.data.error.status,
        };
        throw  err_resp;
    }
}

async function searchVideo(search) {
    try {
        const searchRes = await searchV(search);
        if(searchRes.code == 400){
            return searchRes;
        }else{
            const size = Object.keys(searchRes.items).length;
            let dataResp = {};

            if(size == 0){
                dataResp = {
                    status: 404,
                    message: 'Error, Video not Found'
                }
                return dataResp;
            }else{
                dataResp = await Promise.all(searchRes.items.map(async (element) => {
                    var vid = await details(element.id.videoId);
                    var vid = vid.items[0];
                    var time = vid.contentDetails.duration.match(/\d+/g);
                    var duration =  time.join(':');

                    video = {
                        published_at: vid.snippet.publishedAt,
                        id: vid.id, 
                        title: vid.snippet.title, 
                        description: vid.snippet.description, 
                        thumbnail: vid.snippet.thumbnails.high.url, 
                        extra: {
                            channelTitle: vid.snippet.channelTitle,
                            likes: vid.statistics.likeCount,
                            views: vid.statistics.viewCount,
                            comments: vid.statistics.commentCount,
                            duration: duration,
                        }
                    }
                    return video;
                }));
                dataRespCode = {
                    code: 200,
                    data:dataResp
                }
            }
            return dataRespCode;
            // Return the responses if needed
        }
    } catch (error) {
        throw  error;
    }
}

module.exports = (app) => {
    app.get("/api/youtube", async (req, res) => {
        try {
            const resp = await searchVideo(req.query.search);
            const dResp = {
                code: 200,
                data: resp
            };
            res.status(dResp.code).json(dResp.data);
        } catch (error) {
            res.status(error.code).json({error});
        }
    });
    
    app.use((req, res) => {
        res.status(404).json({
            error: {
                status: 404,
                message: 'Url not found, please verify'
            }
        });
    });
};
