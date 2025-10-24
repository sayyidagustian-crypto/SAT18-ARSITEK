import React from 'react';
import { FileIcon } from './FileIcon';
import type { TreeNode } from '../types';

export const Tree = ({ data }: { data: TreeNode[] }) => (
  <ul className="space-y-1">
    {data.map((node, index) => (
      <li key={index}>
        <div className="flex items-center">
          <FileIcon type={node.type} />
          <span>{node.name}</span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="pl-6 border-l-2 border-slate-200 dark:border-slate-700 ml-3">
            <Tree data={node.children} />
          </div>
        )}
      </li>
    ))}
  </ul>
);
