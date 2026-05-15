import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import ndiRoutes from "./routes/ndiRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World Dendup is here!');
});

app.get('/webhook', (req, res) => {
    res.send('webhook response is here');
});

// routes
app.use("/api/ndi", ndiRoutes)

await connectDB();

app.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${port}`);
});
