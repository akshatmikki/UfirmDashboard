import React, { useEffect, useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { getCategories, getStock, addStockQuantity, getItemsByCategory, uploadStockExcel } from '../../Services/InventoryService';
import { useSelector } from "react-redux";
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';

const StockMaster = () => {
    const propertyId = useSelector((state) => state.Commonreducer.puidn);

    const emptyallGridData = {
        PropertyId: propertyId,
        ItemName: "N/A",
        Quantity: 0,
        Description: "N/A",
        CategoryName: "N/A",
        CurrentQty: 0,
        MinStockLevel: 0,
        StockId: 0,
        ItemId: 0,
        ItemDescription: "N/A",
        BrandName: "N/A",
        CategoryId: 0,
    };

    const [filteredGridData, setFilteredGridData] = useState([emptyallGridData]);
    const toast = useRef(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showAddQtyDialog, setShowAddQtyDialog] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [addQty, setAddQty] = useState(0);
    const [addRate, setAddRate] = useState(0);
    const [addQtyDialogCategory, setAddQtyDialogCategory] = useState(null);
    const [dialogItems, setDialogItems] = useState([]);
    const [loadingDialogItems, setLoadingDialogItems] = useState(false);

    useEffect(() => {
        if (!propertyId) {
            setFilteredGridData([]);
            setCategories([]);
            return;
        }

        const fetchStock = async () => {
            try {
                const stockData = await getStock(propertyId);
                const uniqueStock = Array.isArray(stockData)
                    ? Array.from(new Map(stockData.map(item => [item.ItemId, item])).values())
                    : [];
                setFilteredGridData(uniqueStock);
            } catch {
                setFilteredGridData([]);
            }
        };

        const fetchCategoriesAsync = async () => {
            try {
                const cats = await getCategories(propertyId);
                setCategories(cats || []);
            } catch {
                setCategories([]);
            }
        };

        fetchStock();
        fetchCategoriesAsync();
    }, [propertyId]);

    useEffect(() => {
        if (!showAddQtyDialog || !propertyId) return;

        const fetchItems = async () => {
            setLoadingDialogItems(true);
            try {
                let items = [];
                if (addQtyDialogCategory) {
                    items = await getItemsByCategory(propertyId, addQtyDialogCategory);
                } else {
                    // If "All" is selected or no category, we can either fetch all items or use current stock
                    // For now, let's stick to the current stock if "All" is selected, 
                    // or we could use getAllItems(propertyId)
                    items = filteredGridData;
                }
                setDialogItems(items || []);
            } catch (error) {
                console.error("Error fetching dialog items:", error);
                setDialogItems([]);
            } finally {
                setLoadingDialogItems(false);
            }
        };

        fetchItems();
    }, [addQtyDialogCategory, showAddQtyDialog, propertyId, filteredGridData]);

    const displayedData = selectedCategory !== null
        ? filteredGridData.filter(item => Number(item.CategoryId) === Number(selectedCategory))
        : filteredGridData;

    if (!propertyId || propertyId === 0) return null;

    // 🔹 CATEGORY SPLIT (ONLY LOGIC CHANGE)
    const MAX_VISIBLE = 5;
    const visibleCategories = categories.slice(0, MAX_VISIBLE);
    const moreCategories = categories.slice(MAX_VISIBLE);

    const itemOptions = dialogItems.map(item => ({
        label: item.ItemName || item.Name, // API might return ItemName or Name depending on the endpoint
        value: item.ItemId || item.Id,
    }));

    const selectedItemObj = filteredGridData.find(i => i.ItemId === selectedItem);

    const handleAddQuantity = async () => {
        if (!selectedItem || !addQty) {
            toast.current.show({
                severity: 'warn',
                summary: 'Warning',
                detail: 'Please select item and quantity'
            });
            return;
        }

        const payload = {
            Id: 0,
            PropertyId: propertyId,
            ItemId: selectedItem,
            MinQty: selectedItemObj?.MinStockLevel || 0,
            CurrentQty: addQty,
            CurrentRate: addQty > 0 ? (addRate || 0) : 0,
        };

        try {
            await addStockQuantity(payload);

            toast.current.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Quantity added successfully'
            });

            setShowAddQtyDialog(false);
            setAddQty(0);
            setSelectedItem(null);
            setAddQtyDialogCategory(null);

            // refresh stock list
            const stockData = await getStock(propertyId);
            const uniqueStock = Array.isArray(stockData)
                ? Array.from(new Map(stockData.map(item => [item.ItemId, item])).values())
                : [];
            setFilteredGridData(uniqueStock);

        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Failed to add quantity'
            });
        }
    };


    const handleExcelUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('propertyId', propertyId);
        formData.append('file', file);

        try {
            await uploadStockExcel(formData);
            toast.current.show({
                severity: 'success',
                summary: 'Success',
                detail: 'Stock updated via Excel successfully'
            });

            // refresh stock list
            const stockData = await getStock(propertyId);
            const uniqueStock = Array.isArray(stockData)
                ? Array.from(new Map(stockData.map(item => [item.ItemId, item])).values())
                : [];
            setFilteredGridData(uniqueStock);

        } catch (error) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: error.message || 'Excel upload failed'
            });
        } finally {
            event.target.value = ''; // Reset input
        }
    };

    const dialogFooter = (
        <div>
            <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setShowAddQtyDialog(false)} />
            <Button label="Add Quantity" icon="pi pi-check" onClick={handleAddQuantity} autoFocus />

        </div>
    );

    return (
        <div className="content-wrapper">
            <Toast ref={toast} />

            <div className="content-header" style={{ padding: '20px 30px', background: '#f8f9fa', borderBottom: '1px solid #dee2e6', marginBottom: 20 }}>
                <div className="d-flex justify-content-between align-items-center">
                    <h1 className="m-0 text-dark" style={{ fontWeight: 600, letterSpacing: '-0.5px' }}>Stock Inventory</h1>
                    <div className="d-flex gap-3">
                        <Button label="Add Quantity" icon="pi pi-plus" className="p-button-success p-button-raised"
                            onClick={() => setShowAddQtyDialog(true)} />
                        <Button label="Upload Excel" icon="pi pi-upload" className="p-button-help p-button-raised"
                            onClick={() => fileInputRef.current.click()} />
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept=".xls,.xlsx"
                            onChange={handleExcelUpload}
                        />
                    </div>
                </div>
            </div>

            <Dialog header="Add Quantity to Item" visible={showAddQtyDialog} style={{ width: '450px' }} modal
                onHide={() => setShowAddQtyDialog(false)} footer={dialogFooter}>
                <div className="p-fluid">
                    <div className="p-field" style={{ marginBottom: 16 }}>
                        <label>Select Category</label>
                        <Dropdown
                            value={addQtyDialogCategory}
                            options={[{ label: 'All', value: null }, ...categories.map(c => ({ label: c.Name, value: c.Id }))]}
                            onChange={e => { setAddQtyDialogCategory(e.value); setSelectedItem(null); }}
                            showClear
                        />
                    </div>

                    <div className="p-field" style={{ marginBottom: 16 }}>
                        <label>Select Item</label>
                        <Dropdown value={selectedItem} options={itemOptions}
                            onChange={e => setSelectedItem(e.value)} filter showClear
                            placeholder={loadingDialogItems ? "Loading items..." : "Select an item"}
                            disabled={loadingDialogItems}
                        />
                    </div>

                    <div className="p-field" style={{ marginBottom: 16 }}>
                        <label>Quantity to Add</label>
                        <InputNumber value={addQty} onValueChange={e => setAddQty(e.value)} min={1} showButtons />
                    </div>

                    <div className="p-field" style={{ marginBottom: 16 }}>
                        <label>Current Rate</label>
                        <InputNumber value={addRate} onValueChange={e => setAddRate(e.value)} min={0} step={0.01} />
                    </div>

                    {selectedItemObj && (
                        <div style={{ fontSize: 13, color: '#888' }}>
                            Current Quantity: {selectedItemObj.CurrentQty}
                        </div>
                    )}
                </div>
            </Dialog>

            {/* 🔹 CATEGORY BAR */}
            <div className="category-container" style={{ padding: '0 30px', marginBottom: 25 }}>
                <div className="d-flex align-items-center gap-2 overflow-auto" style={{ paddingBottom: 10, scrollbarWidth: 'none' }}>
                    <Button
                        label="All Categories"
                        className={`p-button-rounded ${selectedCategory === null ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                        onClick={() => setSelectedCategory(null)}
                        style={{ minWidth: 140, transition: 'all 0.2s' }}
                    />

                    {visibleCategories.map(cat => (
                        <Button
                            key={cat.Id}
                            label={cat.Name}
                            className={`p-button-rounded ${selectedCategory === cat.Id ? 'p-button-primary' : 'p-button-outlined p-button-secondary'}`}
                            onClick={() => setSelectedCategory(cat.Id)}
                            style={{ minWidth: 120, transition: 'all 0.2s' }}
                        />
                    ))}

                    {moreCategories.length > 0 && (
                        <Dropdown
                            value={selectedCategory}
                            options={moreCategories.map(cat => ({ label: cat.Name, value: cat.Id }))}
                            onChange={e => setSelectedCategory(e.value)}
                            placeholder="More Categories"
                            style={{ width: 180 }}
                            className="p-button-rounded"
                        />
                    )}
                </div>
            </div>

            {/* ITEM LIST */}
            <div className="item-list-container" style={{ padding: '0 30px 40px' }}>
                {displayedData.map(item => {
                    const received = item.CurrentQty || 0;
                    const minStock = item.MinStockLevel || 1;
                    const maxQty = 10 * minStock;
                    const receivedPercent = Math.min(received / maxQty, 1);
                    const isLowStock = received < minStock;

                    return (
                        <div key={item.ItemId} className="stock-item-row" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 20,
                            marginBottom: 20,
                            padding: '15px',
                            background: '#fff',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            cursor: 'default'
                        }}>
                            <div className="item-info" style={{
                                minWidth: '300px',
                                maxWidth: '300px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2
                            }}>
                                <div style={{ fontWeight: '600', fontSize: '16px', color: '#333', lineHeight: '1.2' }}>
                                    {item.ItemName}
                                </div>
                            </div>

                            <div className="progress-wrapper" style={{
                                flex: 1,
                                height: 36,
                                background: '#f1f3f5',
                                borderRadius: 18,
                                position: 'relative',
                                overflow: 'hidden',
                                border: '1px solid #e9ecef'
                            }}>
                                <div style={{
                                    width: `${receivedPercent * 100}%`,
                                    background: isLowStock
                                        ? 'linear-gradient(90deg, #ff6b6b, #fa5252)'
                                        : 'linear-gradient(90deg, #51cf66, #40c057)',
                                    height: '100%',
                                    borderRadius: 18,
                                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                }} />

                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    padding: '0 20px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    color: receivedPercent > 0.8 ? '#fff' : '#495057',
                                    textShadow: receivedPercent > 0.8 ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                }}>
                                    <span>Quantity: {received}</span>
                                </div>
                            </div>

                            <div style={{ minWidth: '100px', textAlign: 'right' }}>
                                {isLowStock ? (
                                    <span style={{
                                        color: '#fa5252',
                                        background: '#fff5f5',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>Low Stock</span>
                                ) : (
                                    <span style={{
                                        color: '#40c057',
                                        background: '#ebfbee',
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>In Stock</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StockMaster;
