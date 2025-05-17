import os
import instaloader
from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse

app = FastAPI()

@app.get("/")
def download_reel(url: str = Query(..., description="URL of the Instagram reel")):
    try:
        shortcode = url.strip("/").split("/")[-1]
        L = instaloader.Instaloader(dirname_pattern="downloads/{target}", filename_pattern="{shortcode}", download_video_thumbnails=False, download_comments=False)
        post = instaloader.Post.from_shortcode(L.context, shortcode)

        if post.typename != "GraphVideo":
            return JSONResponse(content={"error": "Provided URL is not a reel or video."}, status_code=400)

        L.download_post(post, target=post.owner_username)

        return {
            "message": "Reel downloaded successfully.",
            "username": post.owner_username,
            "shortcode": shortcode,
            "title": post.title,
            "video_url": post.video_url
        }
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
