import React from 'react';
import { createRoot } from 'react-dom/client';
import PricingComponent from "./PricingConnection.jsx"
import FileUplaod from "../ReactComponents/FileUploader/FileUploader.jsx"

const container = document.getElementById('app');
const root = createRoot(container);
root.render(<PricingComponent />);
