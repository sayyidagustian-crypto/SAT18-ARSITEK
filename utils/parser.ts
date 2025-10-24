import type { TreeNode } from './types';

// This file will contain utility functions for parsing data.

export const getTitleFromContent = (content: string) => {
  const firstLine = content.split('\n')[0];
  const cleanedTitle = firstLine.replace(/#/g, '').trim();
  return cleanedTitle || "Catatan Tanpa Judul";
};

export const getContentSnippet = (content: string) => {
    return content.replace(/^[#\s]*/, '').split('\n').find(line => line.trim() !== '')?.substring(0, 100) || 'Tidak ada konten.';
}

export const parseTextToTree = (text: string): TreeNode[] => {
    const lines = text.trim().split('\n');
    const root: TreeNode[] = [];
    const stack: { node: TreeNode; indent: number }[] = [];

    lines.forEach(line => {
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1].length : 0;
        const name = line.trim();
        const type = name.endsWith('/') ? 'folder' : 'file';
        const node: TreeNode = { name: name.replace(/\/$/, ''), type };
        
        if (type === 'folder') {
            node.children = [];
        }

        while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
            stack.pop();
        }

        if (stack.length === 0) {
            root.push(node);
        } else {
            const parent = stack[stack.length - 1].node;
            if (parent.type === 'folder') {
                parent.children?.push(node);
            }
        }
        
        if (type === 'folder') {
            stack.push({ node, indent });
        }
    });

    return root;
};
