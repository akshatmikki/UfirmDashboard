import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { getPurchaseOrder } from "../../Services/InventoryService";
import { useSelector } from "react-redux";
import PurchaseOrderPage from './PurchaseOrderPage';
import ExportToCSV from '../../ReactComponents/ExportToCSV/ExportToCSV';
import { InputText } from 'primereact/inputtext';
import PreviewPurchaseOrder from './PreviewPurchaseOrder';

const PurchaseOrderMaster = () => {
    const [loading, setLoading] = useState(false);
    const propertyId = useSelector((state) => state.Commonreducer.puidn);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [selectedRow, setSelectedRow] = useState([]);
    const emptyallGridData = {
        POId: "XXXXX",
        Dates: "N/A",
        VendorId: 0,
        VendorName: "N/A",
        PropertyId: propertyId,
        CreatedBy: 0,
        Items: [{
            ItemId: 0,
            ItemName: "N/A",
            Price: 0,
            Quantity: 0,
            Description: "N/A",
            BrandName: "N/A",
            MeasurementUnit: "N/A",
            HSNCode: 0,
            IsCompleted: null,
            IsRejected: null,
            RejectionRemarks: null,
        },],
        BillingAddress: "N/A",
        ShippingAddress: "N/A",
    };
    const [filteredGridData, setFilteredGridData] = useState([emptyallGridData]);
    const [displayDialog, setDisplayDialog] = useState(false);
    const [preview, setpreview] = useState(false);
    const toast = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            if (propertyId) {
                const data = await getPurchaseOrder(propertyId);
                setFilteredGridData(data);
            }
            else {
                setFilteredGridData([]);
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: `Please select a property`,
                    life: 3000,
                })
            }
        };
        fetchData();
    }, [propertyId]);

    const openDialog = () => {
        setDisplayDialog(true);
    };

    const onHideDialog = () => {
        setDisplayDialog(false);
        setpreview(false);
    };

    const onGlobalFilterChange = (e) => {
        setGlobalFilterValue(e.target.value);
    };

    const handleRemoveVendor = () => {
    };

    const printRow = (rowData) => {
        const content = `
        <html>
            <head>
                <title>Print Purchase Order</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                    th, td { border: 1px solid #000; padding: 8px; }
                    h4 { text-align: center; margin-top: 30px; }
                </style>
            </head>
            <body>
                <p>${rowData.PONumber}</p>
                <div style="display: flex; justify-content: space-between;">
                    <p>To,</p>
                    <p>Date: ${rowData.PODateTime}</p>
                </div>
                <p><b>${rowData.VendorName}</b></p>
                <p style="margin-top: 30px;"><b>Subject: Order</b></p>
                <p style="margin-top: 30px;">Dear Sir,</p>
                <p>With reference to your quotation, we are pleased to place an order as per the following:</p>

                <table>
                    <thead>
                        <tr>
                            <th>S/N</th>
                            <th>Material</th>
                            <th>Description</th>
                            <th>Unit</th>
                            <th>HSN Code</th>
                            <th>Quantity</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowData.Items.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.ItemName}</td>
                                <td>${item.Description || 'N/A'}</td>
                                <td>${item.MeasurementUnit || 'Unit'}</td>
                                <td>${item.HSNCode || 'N/A'}</td>
                                <td>${item.Quantity}</td>
                                <td>${item.Rate}</td>
                                <td>${item.LineTotal}</td>
                            </tr>`).join('')
            }
                    </tbody>
                </table>

                <p style="margin-top: 30px;"><b>Our Co's GSTin No is 09AAACO5127B1ZU</b></p>
                <p><b>Billing Address:</b> ${rowData.BillingAddress}</p>
                <p><b>Shipping Address:</b> ${rowData.ShippingAddress}</p>

                <h4><b>Terms & Conditions</b></h4>
                <table>
                    <tbody>
                        <tr><td>1) Applicable Taxes shall be extra and as applicable</td></tr>
                        <tr><td>2) Validity: 30 Days</td></tr>
                        <tr><td>3) Payment Terms: 30% advance with order, 50% on delivery & balance after installation and handing over</td></tr>
                        <tr><td>4) All civil and electrical work will be in the scope of client</td></tr>
                        <tr><td>5) Above wire & conduit qty is tentative, may vary and will be charged on actual</td></tr>
                    </tbody>
                </table>
                <p style="margin-top: 30px;">Thanking you</p>
                <p>For <b>OMKAR NESTS PRIVATE LIMITED</b></p>
            </body>
        </html>
    `;

        const printWindow = window.open("", "_blank");
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    };

    const actionBodyTemplate = (rowData) => {
        const Item = rowData.Items;
        const hasIncompleteItems = Array.isArray(Item) && Item.some(item => {
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
        });
        if (hasIncompleteItems === true) {
            return (
            <>
                <Button
                    icon={<i className="fa fa-eye" aria-hidden="true"></i>}
                    className="p-button-rounded rounded p-button-info mr-2"
                    onClick={() => {
                        setSelectedRow(rowData);
                        setpreview(true);
                    }}
                />
                <Button
                    icon={<i className="fa fa-print" aria-hidden="true"></i>}
                    className="p-button-rounded rounded p-button-info"
                    style={{ backgroundColor: 'green', borderColor: 'green', color: 'white' }}
                    onClick={() => {
                        printRow(rowData);
                    }}
                />
                <span title="Some items are incomplete" style={{ color: 'red', fontSize: '27px', marginLeft: '10px' }}>
                    &#9888;
                </span>
            </>
            );
        }
        return (
            <React.Fragment>
                <Button
                    icon={<i className="fa fa-eye" aria-hidden="true"></i>}
                    className="p-button-rounded rounded p-button-info mr-2"
                    onClick={() => {
                        setSelectedRow(rowData);
                        setpreview(true);
                    }}
                />
                <Button
                    icon={<i className="fa fa-print" aria-hidden="true"></i>}
                    className="p-button-rounded rounded p-button-info"
                    style={{ backgroundColor: 'green', borderColor: 'green', color: 'white' }}
                    onClick={() => {
                        printRow(rowData);
                    }}
                />
            </React.Fragment>
        )
    }

    const header = (
        <div className="d-flex justify-content-between align-items-center p-2" style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6', width: '100%' }}>
            <div>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <i className="fa fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6c757d', fontSize: '14px', zIndex: 10, pointerEvents: 'none' }} />
                    <InputText
                        type="search"
                        value={globalFilterValue}
                        onChange={onGlobalFilterChange}
                        placeholder="Search..."
                        style={{ height: '40px', fontSize: '14px', borderRadius: '4px', paddingLeft: '38px', border: '1px solid #ced4da', width: '250px' }}
                    />
                </div>
            </div>

            <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                <ExportToCSV data={filteredGridData} />
                <Button 
                    label="Create Purchase Order" 
                    icon="pi pi-plus" 
                    className="p-button-success" 
                    style={{ height: '40px', fontSize: '14px', borderRadius: '4px', backgroundColor: '#198754', borderColor: '#198754', fontWeight: 500 }}
                    onClick={openDialog} 
                />
            </div>
        </div>
    )

    return (
        <div className="content-wrapper">
            <Toast ref={toast} />
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-2">
                        <div className="col">
                            <h1 className="m-0 text-dark">Purchase Order</h1>
                        </div>
                    </div>
                </div>
            </div>
            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <DataTable
                            value={filteredGridData}
                            paginator
                            rows={15}
                            loading={loading}
                            stripedRows
                            emptyMessage="No records found matching your criteria."
                            dataKey="PurchaseOrderId"
                            globalFilter={globalFilterValue}
                            header={header}
                        >
                            <Column header="PO Id" field='PONumber' />
                            <Column header="Vendor" field='VendorName' />
                            <Column header="Shipping Address" field='ShippingAddress' />
                            <Column header="Billing Address" field='BillingAddress' />
                            <Column header="Action" body={actionBodyTemplate} />
                        </DataTable>
                    </div>
                </div>
            </section>
            <Dialog
                visible={displayDialog}
                onHide={onHideDialog}
                modal
                style={{ width: '90vw', height: '90vh' }}
                header="Create Purchase Order"
            >
                <PurchaseOrderPage />
            </Dialog>

            <Dialog
                visible={preview}
                onHide={onHideDialog}
                modal
                style={{ width: '90vw', height: '90vh' }}
                header={
                    <div>
                        <h5 className='mb-4'>Preview Purchase Order</h5>
                        {selectedRow && (
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5>Purchase Order ID: {selectedRow.PONumber}</h5>
                                <h5>Date: {selectedRow.PODateTime}</h5>
                            </div>
                        )}
                    </div>
                }>
                <PreviewPurchaseOrder groupedItems={selectedRow} onRemoveVendor={handleRemoveVendor} />
            </Dialog>
        </div >
    );
};

export default PurchaseOrderMaster;