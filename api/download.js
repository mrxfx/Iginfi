import axios from "axios";
import cheerio from "cheerio";

export default async (req, res) => {
  const { url } = req.query;

  if (!url || !url.includes("instagram.com")) {
    return res.status(400).json({ error: "Invalid or missing Instagram URL" });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const scriptTag = $('script[type="application/ld+json"]').html();
    if (!scriptTag) throw new Error("No ld+json script found");

    const jsonData = JSON.parse(scriptTag);

    if (!jsonData.contentUrl && !jsonData.thumbnailUrl) {
      return res.status(404).json({ error: "No media found." });
    }

    res.json({
      title: jsonData.caption || "Instagram Media",
      type: jsonData["@type"],
      media: jsonData.contentUrl || null,
      thumbnail: jsonData.thumbnailUrl || null
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Error parsing Instagram data." });
  }
};
