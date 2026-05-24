import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import PreviewPurchaseOrder from './PreviewPurchaseOrder';
import { createPurchaseOrder } from '../../Services/InventoryService';
import { Toast } from 'primereact/toast';
import { useSelector } from 'react-redux';
import { updatePOStatus } from '../../Services/ItemassignService';

const POQuantityComponent = ({
    selectedGridData = [],
    selectedIds = [],
    refreshItemAssigned,
    isFromItemAssigned = false,
    onPOCreated
}) => {
    const [shippingAddress, setShippingAddress] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [items, setItems] = useState([]);
    const [displayafterPlaceOrder, setDisplayafterPlaceOrder] = useState(false);
    const toast = useRef(null);
    const propertyId = useSelector((state) => state.Commonreducer.puidn);

    const onHideDialog = () => {
        setDisplayafterPlaceOrder(false);
        setShippingAddress('');
        setBillingAddress('');
    };

    const handleCreatePO = async (grouped) => {
    try {

        // ✅ CREATE PURCHASE ORDER
        const response = await createPurchaseOrder(grouped);

        // ✅ UPDATE ITEM SPECIFICATION STATUS
        if (response && isFromItemAssigned && selectedIds.length > 0) {
            await updatePOStatus(selectedIds);
        }

        // ✅ REFRESH ITEM ASSIGNED PAGE
        if (refreshItemAssigned) {
            await refreshItemAssigned();
        }

        if (onPOCreated) {
            onPOCreated();
        }

        toast.current.show({
            severity: 'success',
            summary: 'Success',
            detail: 'Purchase Order Created Successfully.',
            life: 3000
        });

        onHideDialog();

    } catch (error) {

        console.error("PO_CREATE_ERROR", error);

        toast.current.show({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to create purchase order',
            life: 3000
        });
    }
};

    const openPlaceOrder = () => {
        setDisplayafterPlaceOrder(true);
    };

    const groupItemsByVendor = (items) => {
        return items.reduce((acc, item) => {
            if (!acc[item.VendorName]) {
                acc[item.VendorName] = [];
            }
            acc[item.VendorName].push(item);
            return acc;
        }, {});
    };

    const handleRemoveVendor = (vendorNameToRemove) => {
        setItems(prevItems => prevItems.filter(item => item.VendorName !== vendorNameToRemove));
    };

    const groupedItemsWithAddresses = useMemo(() => {
        const itemsWithAddresses = items.map(item => ({
            ...item,
            ShippingAddress: shippingAddress,
            BillingAddress: billingAddress,
        }));
        return groupItemsByVendor(itemsWithAddresses);
    }, [items, shippingAddress, billingAddress]);

    const transformedPreviewData = useMemo(() => {
        return Object.entries(groupedItemsWithAddresses).map(([vendorName, items]) => {
            const { ShippingAddress, BillingAddress, VendorId } = items[0];
            return {
                POId: "XXXXX",
                Dates: new Date().toLocaleDateString(),
                VendorId: VendorId || 0,
                VendorName: vendorName,
                PropertyId: propertyId,
                CreatedBy: 0,
                Items: items.map(({ ItemId, ItemName, Price, Quantity, Description, BrandName, MeasurementUnit, HSNCode }) => ({
                    ItemId,
                    ItemName,
                    Price,
                    Quantity,
                    Description,
                    BrandName,
                    MeasurementUnit,
                    HSNCode
                })),
                ShippingAddress,
                BillingAddress,
            };
        });
    }, [groupedItemsWithAddresses]);

    useEffect(() => {
        const updatedItems = selectedGridData.map(item => ({
            ...item,
            TotalAmount: (item.Quantity || 0) * (item.Price || 0)
        }));
        setItems(updatedItems);
    }, [selectedGridData]);

    const updateItemQuantity = (id, quantity) => {
        setItems(prevItems => {
            const updated = [...prevItems];
            const index = updated.findIndex(item => item.Id === id);
            if (index > -1) {
                const item = updated[index];
                updated[index] = {
                    ...item,
                    Quantity: quantity,
                    TotalAmount: (quantity || 0) * (item.Price || 0),
                };
            }
            return updated;
        });
    };

    const RateTemplate = useCallback((rowData) => {
        return rowData.Price ? <span>{`₹${rowData.Price} /${rowData.MeasurementUnit}`}</span> : null;
    }, []);

    const QuantityTemplate = useCallback((rowData) => (
        <InputNumber
            value={rowData.Quantity}
            min={0}
            onValueChange={(e) => updateItemQuantity(rowData.Id, e.value)}
            buttonLayout="stacked"
            showButtons={!isFromItemAssigned}
            disabled={isFromItemAssigned}
        />
    ), [isFromItemAssigned]);

    const TotalAmountTemplate = useCallback((rowData) => {
        const amount = Number(rowData.TotalAmount) || 0;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    }, []);

    const grandTotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.TotalAmount || 0), 0);
    }, [items]);

    return (
        <>
        <Toast ref={toast} />
        <div>
            <div className="d-flex justify-content-between mb-4">
                <div className="d-flex flex-column me-3 flex-grow-1">
                    <label htmlFor="Shipping">Shipping Address</label>
                    <InputText
                        id="Shipping"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="Enter shipping address"
                    />
                </div>
                <div className="d-flex flex-column ms-3 flex-grow-1">
                    <label htmlFor="Billing">Billing Address</label>
                    <InputText
                        id="Billing"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                        placeholder="Enter billing address"
                    />
                </div>
            </div>

            <DataTable
                value={items}
                dataKey="Id"
                paginator
                rows={15}
                responsiveLayout="scroll"
                className="mb-3"
            >
                <Column field="ItemName" header="Item" />
                <Column field="Description" header="Description" />
                <Column field="VendorName" header="Vendor" />
                <Column field="BrandName" header="Brand" />
                <Column body={RateTemplate} header="Price" />
                <Column field="HSNCode" header="HSN Code" />
                <Column header="Quantity" body={QuantityTemplate} />
                <Column body={TotalAmountTemplate} header="Total Amount" />
            </DataTable>

            <div className="text-end mt-3">
                <strong>Total Order Amount: </strong>
                {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                }).format(grandTotal)}
            </div>

            <div className="d-flex justify-content-end mt-3">
                <Button label="Preview Order" icon="pi pi-check" className="p-button-success" onClick={openPlaceOrder} />
            </div>

            <Dialog
                visible={displayafterPlaceOrder}
                onHide={onHideDialog}
                modal
                style={{ width: '90vw', maxHeight: '90vh', overflowY: 'auto' }}
                header={
                    <div>
                        <h5 className='mb-4'>Preview Purchase Order(s)</h5>
                        {transformedPreviewData.length > 0 && ( 
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5>Purchase Order ID: {transformedPreviewData[0].POId}</h5> 
                                <h5>Date: {transformedPreviewData[0].Dates}</h5> 
                            </div>
                        )}
                    </div>
                }
                footer={
                    <div className="d-flex justify-content-end w-100">
                        <Button
                            label="Confirm & Create All POs"
                            icon="pi pi-save"
                            onClick={() => handleCreatePO(transformedPreviewData)}
                        />
                    </div>
                }
            >
                {transformedPreviewData.map((group, index) => (
                    <div key={index} className="mb-4 border-bottom pb-3">
                        <PreviewPurchaseOrder
                            groupedItems={group}
                            onRemoveVendor={handleRemoveVendor}
                        />
                    </div>
                ))}
            </Dialog>
        </div>
        </>
    );
};

export default POQuantityComponent;
