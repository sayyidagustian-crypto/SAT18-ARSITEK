import React from 'react';

export const FileIcon = ({ type }: { type: 'file' | 'folder' }) => (
  <span className="mr-2 text-indigo-400">{type === 'folder' ? '📁' : '📄'}</span>
);
