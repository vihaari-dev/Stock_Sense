const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.replace(search, replace);
  }
  fs.writeFileSync(filePath, content);
}

// 1. src/api/auth.ts
replaceInFile(path.join(__dirname, 'src/api/auth.ts'), [
  ["import { AuthResponse, MessageResponse, UserResponse } from '../types/auth';", "import type { AuthResponse, MessageResponse, UserResponse } from '../types/auth';"]
]);

// 2. src/api/client.ts
replaceInFile(path.join(__dirname, 'src/api/client.ts'), [
  ["import { AuthResponse } from '../types/auth';", "import type { AuthResponse } from '../types/auth';"]
]);

// 3. src/components/ProtectedRoute.tsx
replaceInFile(path.join(__dirname, 'src/components/ProtectedRoute.tsx'), [
  ["import { Role } from '../types/auth';", "import type { Role } from '../types/auth';"]
]);

// 4. src/context/AuthContext.tsx
replaceInFile(path.join(__dirname, 'src/context/AuthContext.tsx'), [
  ["import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';", "import React, { createContext, useContext, useState, useEffect } from 'react';\nimport type { ReactNode } from 'react';"],
  ["import apiClient, { getAccessToken, setAccessToken } from '../api/client';", "import apiClient, { setAccessToken } from '../api/client';"],
  ["import { Role } from '../types/auth';", "import type { Role } from '../types/auth';"]
]);

// 5. src/pages/Dashboard.tsx
replaceInFile(path.join(__dirname, 'src/pages/Dashboard.tsx'), [
  ["import { useAuth } from '../../context/AuthContext';", "import { useAuth } from '../context/AuthContext';"],
  ["import { logout } from '../../api/auth';", "import { logout } from '../api/auth';"]
]);
