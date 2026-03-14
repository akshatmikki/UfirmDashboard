import React from 'react';
import { createRoot } from 'react-dom/client';
import PriceDisplay from "./PriceDisplay.jsx"

const container = document.getElementById('pricedisplay');
const root = createRoot(container);
root.render(<PriceDisplay />);

