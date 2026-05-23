
import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { getCategories, fetchFilteredItems, getVendors, fetchFilteredRate } from "../../Services/InventoryService";
import { useSelector } from "react-redux";
import POQuantityComponent from './POQuantityComponent';
const EMPTY_ARRAY = [];
const PurchaseOrderPage = ({ initialItems = EMPTY_ARRAY, initialIds = EMPTY_ARRAY, refreshItemAssigned = null, onPOCreated }) => {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [Items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [allVendors, setAllVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const emptyallGridData = {
        POId: "xxxxx",
        Dates: "N/A",
        ItemId: 0,
        VendorId: 0,
        ItemName: "N/A",
        VendorName: "N/A",
        BrandName: "N/A",
        Price: 0,
        MeasurementUnit: "N/A",
        HSNCode: 0,
        Description: "N/A",
        Quantity: 0,
        TotalAmount: 0,
        BillingAddress: "N/A",
        ShippingAddress: "N/A",
    };
    const [filteredGridData, setFilteredGridData] = useState([emptyallGridData]);
    const [selectedGridData, setSelectedGridData] = useState([]);
    const [displayDialog, setDisplayDialog] = useState(false);
    const [isFetchingRates, setIsFetchingRates] = useState(true);
    const propertyId = useSelector((state) => state.Commonreducer.puidn);

    const toast = useRef(null);

    useEffect(() => {
        if (propertyId) {
            setFilteredGridData([]);
            getAllCategories(propertyId);
            getAllVendors(propertyId);
        } else {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Please Select a Property.',
                life: 3000
            });
            setFilteredGridData([]);
        }
    }, [propertyId]);

    useEffect(() => {
        const fetchData = async () => {
            const category = selectedCategory ? selectedCategory : null;
            const item = selectedItem ? selectedItem : null;
            const vendor = selectedVendor ? selectedVendor : null;
            if (propertyId) {
                setIsFetchingRates(true);
                try {
                    getItems(propertyId, category);
                    const data = await fetchFilteredRate(propertyId, category, item, vendor);
                    setFilteredGridData(data || []);
                } finally {
                    setIsFetchingRates(false);
                }
            }
        };
        fetchData();
    }, [propertyId, selectedCategory, selectedItem, selectedVendor]);

    const isFromItemAssigned = initialItems && initialItems.length > 0;
    
    const tableProps = isFromItemAssigned ? { dataKey: "Id" } : {};

    const displayData = React.useMemo(() => {
        if (!isFromItemAssigned) {
            return filteredGridData.map((item, index) => ({
                ...item,
                Id: item.Id || `normal-${item.ItemId}-${item.VendorId}-${index}`
            }));
        }

        return initialItems.map((assignedItem) => {
            const rateCard = filteredGridData.find(rc => rc.ItemId === assignedItem.ItemId) || {};
            const specs = Array.isArray(assignedItem.Details) 
                ? assignedItem.Details.map(d => `${d.Specification_Name}: ${d.Specification_Value}`).join(', ')
                : "";

            return {
                ...rateCard,
                Id: assignedItem.Id,
                AssignedId: assignedItem.Id,
                ItemId: assignedItem.ItemId,
                ItemName: assignedItem.Item_Name || rateCard.ItemName || 'Unknown',
                Description: specs || rateCard.Description || '',
                Quantity: assignedItem.Quantity || 0,
                VendorName: rateCard.VendorName || "N/A",
                VendorId: rateCard.VendorId || 0,
                Price: rateCard.Price || 0,
                MeasurementUnit: rateCard.MeasurementUnit || 'Unit',
                HSNCode: rateCard.HSNCode || 0,
            };
        });
    }, [isFromItemAssigned, initialItems, filteredGridData]);

    const [autoSelectDone, setAutoSelectDone] = useState(false);

    useEffect(() => {
        setAutoSelectDone(false);
        setSelectedGridData([]);
    }, [initialItems]);

    useEffect(() => {
        if (isFromItemAssigned && !isFetchingRates && !autoSelectDone && displayData.length > 0) {
            setSelectedGridData(displayData);
            setAutoSelectDone(true);
        }
    }, [isFromItemAssigned, isFetchingRates, autoSelectDone, displayData]);

    const getAllCategories = async (propertyId) => {
        setLoading(true);
        try {
            const data = await getCategories(propertyId);
            setCategories(data);
        } catch (error) {
            console.error('Error fetching Categories:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to fetch categories.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const getAllVendors = async (propertyId) => {
        setLoading(true);
        try {
            const data = await getVendors(propertyId);
            setAllVendors(data);
        } catch (error) {
            console.error('Error fetching Vendors:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to fetch vendors.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const getItems = async (propertyId, selectedCategory) => {
        setLoading(true);
        try {
            const data = await fetchFilteredItems(propertyId, selectedCategory);
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching Items:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to fetch items.',
                life: 3000
            });
        } finally {

            setLoading(false);
        }
    };
    const handleItemSelect = (e) => {
        const itemId = e.target.value;
        setSelectedItem(itemId);
    };

    const handleVendorSelect = (e) => {
        const vendorId = e.target.value;
        setSelectedVendor(vendorId);
    };

    const Ratetemplate = (rowData) => {
        return rowData.Price ? <span>{`₹${rowData.Price} /${rowData.MeasurementUnit}`}</span> : null;
    };

    const vendorTemplate = (rowData) => {
        return rowData.VendorId ? <span>{`${rowData.VendorName || ''}`}</span> : null;
    };


    const openDialog = () => {
        if (selectedGridData.length > 0) {
            setDisplayDialog(true);
        }
    };

    const onHideDialog = () => {
        setDisplayDialog(false);
        setSelectedGridData([]);
    };

    return (
        <div>
            <Toast ref={toast} />
            <section className="content">
                <div>
                    <div className="row">
                        <div className="col">
                            <label>Category</label>
                            <select
                                className="form-control"
                                value={selectedCategory || ''}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.Id} value={cat.Id}>
                                        {cat.Name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col">
                            <label>Items</label>
                            <select
                                className="form-control"
                                value={selectedItem || ''}
                                onChange={handleItemSelect}
                            >
                                <option value="">Select Item</option>
                                {Items.map((item) => (
                                    <option key={item.Id} value={item.Id}>
                                        {item.Name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col">
                            <label>Vendor</label>
                            <select
                                className="form-control"
                                value={selectedVendor || ''}
                                onChange={handleVendorSelect}
                            >
                                <option value="">Select Vendor</option>
                                {allVendors.map((ven) => (
                                    <option key={ven.Id} value={ven.Id}>
                                        {ven.Name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="row mt-3">
                        <DataTable
                            value={displayData}
                            dataKey="Id"
                            paginator
                            rows={15}
                            loading={loading}
                            selectionMode="checkbox"
                            selection={selectedGridData}
                            onSelectionChange={(e) => setSelectedGridData(e.value)}
                            emptyMessage="No records found matching your criteria."
                        >
                            <Column body={vendorTemplate} header="Vendor" />
                            <Column field='ItemName' header="Item" />
                            <Column field='Description' header="Item Description" />
                            <Column field='BrandName' header="Brand" />
                            <Column body={Ratetemplate} header="Price" />
                            <Column selectionMode="multiple" header={<div className='px-2'>Select</div>} />
                        </DataTable>
                    </div>
                    <div className="row mt-3">
                        <div className="col-12 text-right">
                            <Button
                                label="Create Purchase Order"
                                icon="pi pi-plus"
                                onClick={openDialog}
                                disabled={selectedGridData.length === 0}
                            />
                        </div>
                    </div>
                </div>
            </section>

            <Dialog
                visible={displayDialog}
                onHide={onHideDialog}
                modal
                style={{ width: '90vw', height: '90vh' }}
                header="Purchase Order"
            >
                <POQuantityComponent 
                   selectedGridData={selectedGridData} 
                   selectedIds={selectedGridData.map(x => x.Id)}
                   refreshItemAssigned={refreshItemAssigned}
                   isFromItemAssigned={isFromItemAssigned}
                   onPOCreated={() => {
                       setDisplayDialog(false);
                       if (onPOCreated) onPOCreated();
                   }}
                />
            </Dialog>

        </div>
    );
};
export default PurchaseOrderPage;