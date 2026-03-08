/**
 * Ref: https://developers.google.com/youtube/v3/getting-started
 */

import { youtube } from "@googleapis/youtube"

const youtubeApiKey = process.env.YOUTUBE_API_KEY;
if (!youtubeApiKey) {
    throw new Error("Missing YOUTUBE_API_KEY");
}

const client = youtube({
    version: "v3",
    auth: youtubeApiKey,
});

export const getVideoDetail = async (videoId: string) => {
    try {
        const video = await client.videos.list({
            id: [videoId],
            part: ['snippet'],
            maxResults: 1,
        })
        const snippet = video.data.items?.[0]?.snippet;

        if (
            video.data.pageInfo?.totalResults === 1
            && snippet?.title
            && snippet.thumbnails?.default
        ) {
            return {
                title: snippet.title,
                thumbnailUrl: snippet.thumbnails.default.url ?? "",
            }
        }
        return null;
    } catch (error) {
        console.error(`Failed to fetch YouTube video details for ID: ${videoId} and error:`, error);
        return null;
    }
}
