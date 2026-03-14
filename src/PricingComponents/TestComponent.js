import React from 'react';
import { createRoot } from 'react-dom/client';
import TestComponent from './TestComponent.jsx';

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<TestComponent />);
