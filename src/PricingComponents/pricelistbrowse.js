import React from 'react';
import { createRoot } from 'react-dom/client';
import PriceListBrowse from "./PriceListBrowse.jsx";


const container = document.getElementById('pricelistbrowse');
const root = createRoot(container);
root.render(<PriceListBrowse />);
