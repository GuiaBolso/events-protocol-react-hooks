import Bundler from "parcel-bundler";
import express from "express";

const app = express();

const randomId = (): string => Math.random().toString(16).substr(3);

app.get("/health", (_, res) => {
  res.end("ok");
});

app.post("/events/others", (_, res) => {
  res.json({
    name: "my:event:response",
    version: 1,
    flowId: randomId(),
    id: randomId(),
    payload: {
      increment: 1,
    },
    metadata: {},
    identity: {},
    auth: {},
  });
});

const index = `${__dirname}/index.html`;
const bundler = new Bundler(index);
app.use(bundler.middleware());

app.listen(1223, () => {
  console.log(`Listening to https://localhost:1223 for ${index}`);
});
