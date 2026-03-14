import React from 'react';
import { createRoot } from 'react-dom/client';
import PriceBrowse from "./PriceBrowse.jsx"


const container = document.getElementById('pricebrowse');
const root = createRoot(container);
root.render(<PriceBrowse />);
