import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import ndiRoutes from "./routes/ndiRoutes.js";
import ngrok from 'ngrok';
import cors from 'cors';
//new commit
dotenv.config();

// using the cors
const app = express();
const port = process.env.PORT ?? 3000;
app.use(cors());

app.use(express.json());

app.get('/', (req, res) => {
    console.log('hello world');
    res.send('Hello World Dendup is here!');
});

// routes
app.use("/api/ndi", ndiRoutes)

await connectDB();

app.listen(port, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${port}`);
});



