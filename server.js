import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import ndiRoutes from "./routes/ndiRoutes.js";
import ngrok from 'ngrok';
import cors from 'cors';
import { startNDINats } from "./services/ndiNats.js";
//new commit
dotenv.config();

// using the cors
const app = express();
const port = process.env.PORT ?? 3000;
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    res.send('hello world');
});

// routes
app.use("/api/ndi", ndiRoutes)

await connectDB();

app.listen(port, "0.0.0.0", async () => {
    console.log(`Server running at http://localhost:${port}`);
    await startNDINats();
});



