import { GoogleGenAI } from "@google/genai";
import { parseTextToTree } from '../utils/parser';
import type { TreeNode } from '../types';

// This file will encapsulate all interactions with the Google Gemini API.

export const generateFileStructure = async (prompt: string): Promise<TreeNode[]> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following description and convert it into a file structure tree. Only output the tree structure. Use indentation to represent hierarchy. Folders must end with a '/'. Do not add any explanation or markdown formatting. \n\nPROMPT:\n${prompt}`,
        });
        
        const textResponse = response.text;
        if (!textResponse) {
            throw new Error("API returned no text.");
        }
        
        return parseTextToTree(textResponse);
    } catch (error) {
        console.error("Error generating file structure:", error);
        // Fallback for failed API call
        return [
            { name: 'Error', type: 'folder', children: [{ name: 'Could not generate structure.', type: 'file' }] }
        ];
    }
};
