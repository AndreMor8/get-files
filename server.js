import 'dotenv/config.js';
import v4 from 'aws-signature-v4';
import fastify from 'fastify';
import fastifyCaching from '@fastify/caching';

const app = fastify();

app.register(fastifyCaching, { privacy: fastifyCaching.privacy.PUBLIC })

app.get("/", (req, res) => {
    res.status(200).send("Hello world!");
});

app.get("/:bucket/*", async (req, res) => {
    if (!process.env.PUBLIC_BUCKETS.split(",").some(e => e === req.params.bucket)) return res.status(400).send("Invalid bucket :(");
    const key = req.url.split("/").slice(2).join("/");
    if (!key) return res.status(403).send("Go put some key :/");
    try {
        res.expires(new Date(Date.now() + (process.env.CACHETIME * 1000))).redirect(302, getLink(req.params.bucket, decodeURIComponent(key), process.env.CACHETIME));
    } catch (err) {
        res.status(500).send(err.toString());
    }
});

function getLink(bucket, key, time) {
    return v4.createPresignedURL("GET", bucket + "." + process.env.ENDPOINT, "/" + key, "s3", "UNSIGNED-PAYLOAD", { region: process.env.REGION, signSessionToken: true, doubleEscape: false, expires: time });
}

const listening = await app.listen({ port: (process.env.PORT || 0), host: (process.env.IP || "127.0.0.1") });
console.log(`Server listening on ${listening}`);
