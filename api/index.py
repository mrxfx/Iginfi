from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import instaloader

app = FastAPI()

@app.get("/")
def read_root(username: str = Query(..., description="Instagram username")):
    try:
        L = instaloader.Instaloader()
        profile = instaloader.Profile.from_username(L.context, username)

        data = {
            "username": profile.username,
            "full_name": profile.full_name,
            "bio": profile.biography,
            "followers": profile.followers,
            "following": profile.followees,
            "posts": profile.mediacount,
            "is_private": profile.is_private,
            "is_verified": profile.is_verified,
            "external_url": profile.external_url,
        }

        return JSONResponse(content=data)

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)