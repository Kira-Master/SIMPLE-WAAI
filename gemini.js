import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
dotenv.config()
const genAI = new GoogleGenerativeAI(process.env.API);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const AI = async(msg) => {
    const result = await model.generateContent(msg);
    console.log(result.response.text())
    }