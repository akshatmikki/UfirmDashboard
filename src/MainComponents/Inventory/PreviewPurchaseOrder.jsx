import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

const PreviewPurchaseOrder = ({ groupedItems, onRemoveVendor }) => {
    const [displayDialog, setDisplayDialog] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const toast = useRef(null);
    if (!groupedItems || !groupedItems.Items) {
        return <div>No purchase order data available.</div>;
    }

    const onHideDialog = () => {
        setDisplayDialog(false);
    };

    const {
        VendorName,
        Items,
        ShippingAddress,
        BillingAddress
    } = groupedItems;

    const totalAmount = Items.reduce((sum, item) => sum + (item.LineTotal || item.Price * item.Quantity || 0), 0);

    const isItemIncomplete = (item) => {
        if (item.IsCompleted === true) return false;
        if (item.IsCompleted === false) {
            const received = item.QuantityReceived !== undefined && item.QuantityReceived !== null ? Number(item.QuantityReceived) : 0;
            const actual = item.Quantity !== undefined && item.Quantity !== null ? Number(item.Quantity) : 0;
            if (item.QuantityReceived !== undefined && item.QuantityReceived !== null && received >= actual) {
                return false;
            }
            return true;
        }
        return false;
    };

    const hasRedRows = Array.isArray(Items) && Items.some(item => isItemIncomplete(item));

    const actionTemplate = (rowData) => {
        if (isItemIncomplete(rowData)) {
            return (
                <React.Fragment>
                    <Button
                        icon={<i className="fa fa-exclamation" aria-hidden="true"></i>}
                        className="p-button-rounded rounded p-button-danger"
                        onClick={() => {
                            setSelectedItem(rowData);
                            setDisplayDialog(true);
                        }}
                    />
                </React.Fragment>
            );
        }
        return null;
    };

    return (
        <>
            <div className="mb-5 border rounded p-3 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="m-0">Vendor: {VendorName}</h5>
                    <Button
                        icon={<i className="fa fa-times"></i>}
                        style={{ backgroundColor: 'white', color: 'black' }}
                        onClick={() => onRemoveVendor(VendorName)}
                    />
                </div>

                <div className="mb-3">
                    <p><strong>Shipping Address:</strong> {ShippingAddress}</p>
                    <p><strong>Billing Address:</strong> {BillingAddress}</p>
                </div>
                <DataTable value={Items} responsiveLayout="scroll" stripedRows className="p-datatable-sm" rowClassName={(rowData) => {
                    if (isItemIncomplete(rowData)) return 'row-red';
                    if (rowData.IsCompleted === true || (rowData.QuantityReceived !== undefined && rowData.QuantityReceived !== null && Number(rowData.QuantityReceived) >= Number(rowData.Quantity))) return 'row-green';
                    return '';
                }}
                >
                    <Column field="ItemName" header="Item" />
                    <Column field="Description" header="Description" />
                    <Column field="Quantity" header="Quantity" />
                    <Column field="Price" header="Price" body={(rowData) => `₹${rowData.Price || rowData.Rate}`} />
                    <Column
                        field="TotalAmount"
                        header="Total"
                        body={(rowData) =>
                            new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                            }).format(rowData.LineTotal || rowData.Price * rowData.Quantity || 0)
                        }
                    />
                    {hasRedRows && (<Column header="Action" body={actionTemplate} />)}
                </DataTable>

                <div className="text-end mt-2">
                    <strong>Subtotal: </strong>
                    {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                    }).format(totalAmount)}
                </div>
                <Dialog
                    visible={displayDialog}
                    onHide={onHideDialog}
                    modal
                    style={{ width: '50vw', maxHeight: '90vh', overflowY: 'auto' }}
                    header="Partial Order"
                >
                    <Toast ref={toast} />
                    {selectedItem && (
                        <>
                            <h5>
                                We have received {selectedItem.QuantityReceived} quantity but actual quantity is {selectedItem.Quantity} of {selectedItem.ItemName}, So what do you want to do:
                            </h5>
                            <div className="flex justify-center items-center mt-4">
                                <div className="flex gap-4">
                                    <Button
                                        className="p-button-success p-button-sm rounded-full rounded mr-4 ml-4"
                                        style={{ fontSize: '0.75rem' }}
                                        onClick={() => {
                                            setDisplayDialog(false);
                                        }}
                                    >
                                        Complete Purchase <i className="fa fa-check ml-2" />
                                    </Button>
                                    <Button
                                        className="p-button-danger p-button-sm rounded-full rounded"
                                        style={{ fontSize: '0.75rem' }}
                                        onClick={() => {
                                            setDisplayDialog(false);
                                        }}
                                    >
                                        Wait for Remaining items <i className="fa fa-times ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </Dialog>
            </div>
        </>
    );
};

export default PreviewPurchaseOrder;