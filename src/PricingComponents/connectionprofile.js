import React from 'react';
import { createRoot } from 'react-dom/client';
import ConnectionProfile from "./ConnectionProfile.jsx"

const container = document.getElementById('ConnectionProfile');
const root = createRoot(container);
root.render(<ConnectionProfile />);
