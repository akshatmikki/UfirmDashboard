"use client"

import React, { useState, useEffect, useRef } from "react"
import axios from 'axios';
import { FilterMatchMode } from "primereact/api"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { InputText } from "primereact/inputtext"
import { Dropdown } from "primereact/dropdown"
import { Button } from "primereact/button"
import { Toast } from "primereact/toast"
import { getCategories, getAllItems, getVendors, createRateCard, getRateCard, fetchFilteredItems, deleteRateCard as deleteRateCardApi } from "../../Services/InventoryService"
import { confirmDialog } from "primereact/confirmdialog"
import { DELETE_CONFIRMATION_MSG } from "../../Contants/Common"
import { Dialog } from "primereact/dialog"
import { useSelector, useDispatch } from "react-redux"
import "primereact/resources/themes/lara-light-blue/theme.css"
import { Calendar } from "primereact/calendar"
import ExportToCSV from "../../ReactComponents/ExportToCSV/ExportToCSV"
import { ConfirmDialog } from "primereact/confirmdialog"

const RateCard = (props) => {
  const [gridData, setGridData] = useState([])
  const [loading, setLoading] = useState(false)
  const propertyId = useSelector((state) => state.Commonreducer.puidn)
  const dispatch = useDispatch()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [vendors, setVendors] = useState([])
  const [globalFilterValue, setGlobalFilterValue] = useState("")
  const toast = useRef(null)
  const [isDialogVisible, setIsDialogVisible] = useState(false)
  const [rateCardData, setRateCardData] = useState({
    CategoryId: 0,
    ItemId: 0,
    VendorId: 0,
    Price: 0.0,
    ValidTill: null,
    CreatedBy: 0,
    IsApproved: true,
    CategoryName: "",
    ItemName: "",
    VendorName: "",
  })
  const [viewDialogVisible, setViewDialogVisible] = useState(false)
  const [selectedRateCard, setSelectedRateCard] = useState(null)
  const [pageMode, setPageMode] = useState("home")
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    CategoryName: { value: null, matchMode: FilterMatchMode.EQUALS },
    ItemName: { value: null, matchMode: FilterMatchMode.EQUALS },
    VendorName: { value: null, matchMode: FilterMatchMode.EQUALS },
  })

  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    if (rateCardData.CategoryId) {
      loadfiltereditems(propertyId, rateCardData)
    }
  }, [propertyId, rateCardData.CategoryId]);

  const loadfiltereditems = async (propertyId, rateCardData) => {
    try {
      const data = await fetchFilteredItems(propertyId, rateCardData.CategoryId)
      setFilteredItems(data);
    } catch (error) {
      console.error("Error fetching Item:", error)
      toast.current.show({ severity: "error", summary: "Error", detail: "Failed to load Item", life: 3000 })
    }
  }

  useEffect(() => {
    if (propertyId) {
      setGridData([])
      loadInitialData()
    } else {
      setGridData([])
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: <div className="flex items-center h-screen">Please select a property</div>,
        life: 3000,
      })
    }
  }, [propertyId])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([loadCategories(), loadItems(), loadVendors()])
      await loadRateCardList()
    } catch (error) {
      console.error("Error loading initial data:", error)
      toast.current.show({ severity: "error", summary: "Error", detail: "Failed to load initial data", life: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const loadRateCardList = async () => {
    try {
      const data = await getRateCard(propertyId)
      setGridData(data)
    } catch (error) {
      console.error("Error fetching Rate Card:", error)
      toast.current.show({ severity: "error", summary: "Error", detail: "Failed to load rate cards", life: 3000 })
    }
  }

  const toISTISOString = (date) => {
    if (!date) return null;

    const istOffset = 330; // minutes
    const localDate = new Date(date);

    const istTime = new Date(
      localDate.getTime() + istOffset * 60 * 1000
    );

    return istTime.toISOString();
  };

  const loadCategories = async () => {
    const data = await getCategories(propertyId)
    setCategories(data)
  }

  const loadItems = async () => {
    const data = await getAllItems(propertyId)
    setItems(data)
  }

  const loadVendors = async () => {
    const data = await getVendors(propertyId)
    setVendors(data)
  }

  const openNew = async () => {
    setRateCardData({
      CategoryId: 0,
      ItemId: 0,
      VendorId: 0,
      Price: 0.0,
      ValidTill: null,
      CreatedBy: 1,
      IsApproved: true,
      CategoryName: "",
      ItemName: "",
      VendorName: "",
    })
    setPageMode("Add")
    setIsDialogVisible(true)
  }

  const viewRateCard = async (data) => {
    setSelectedRateCard({
      ...data,
      Category: data.CategoryName,
      Item: data.ItemName,
      Vendor: data.VendorName,
      ValidTill: data.ValidTill,
    })
    setViewDialogVisible(true)
  }

  const hideDialog = () => {
    setIsDialogVisible(false)
  }

  const hideViewDialog = () => {
    setViewDialogVisible(false)
  }

  const saveRateCard = async () => {
    setLoading(true)
    try {
      const payload = {
        ...rateCardData,
        PropertyId: propertyId,
        ValidTill: toISTISOString(rateCardData.ValidTill),
      }
      await createRateCard(payload)
      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: `Rate Card ${rateCardData.Id === undefined ? "created" : "updated"} successfully`,
        life: 3000,
      })
      setIsDialogVisible(false)
      loadRateCardList()
    } catch (error) {
      console.error("Error saving Rate Card:", error)
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: `Failed to ${rateCardData.Id === undefined ? "create" : "update"} rate card`,
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (data) => {
    confirmDialog({
      message: DELETE_CONFIRMATION_MSG,
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => deleteRateCard(data),
      reject: () => { },
    })
  }

  const deleteRateCard = async (data) => {
    setLoading(true)

    try {
      await deleteRateCardApi(data.Id)

      await loadRateCardList()

      toast.current.show({
        severity: "success",
        summary: "Success",
        detail: "Rate Card deleted successfully",
        life: 3000,
      })
    } catch (error) {
      console.error("Error deleting Rate Card:", error)

      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: error.message || "Failed to delete rate card",
        life: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const onCategoryChange = (e) => {
    const selectedCategoryId = e.value
    setRateCardData({
      ...rateCardData,
      CategoryId: selectedCategoryId.Id,
      CategoryName: selectedCategoryId.Name,
      ItemId: 0,
      ItemName: "",
    })
  }

  const onItemChange = (e) => {
    const selectedItemId = e.value
    setRateCardData({ ...rateCardData, ItemId: selectedItemId.Id, ItemName: selectedItemId.Name })
  }

  const onVendorChange = (e) => {
    const selectedVendorId = e.value
    setRateCardData({ ...rateCardData, VendorId: selectedVendorId.Id, VendorName: selectedVendorId.Name })
  }

  const formatDate = (value) => {
    if (value) {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      }
    }
    return ""
  }

  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <Button
          icon={<i className="fa fa-eye" aria-hidden="true"></i>}
          className="p-button-rounded p-button-info mr-2"
          onClick={() => viewRateCard(rowData)}
          tooltip="View"
        />
        <Button
          icon={<i className="fa fa-trash" aria-hidden="true"></i>}
          className="p-button-rounded p-button-danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Delete"
        />
      </React.Fragment>
    )
  }

  const onGlobalFilterChange = (e) => {
    const value = e.target.value
    setGlobalFilterValue(value)
    setFilters((prevFilters) => ({
      ...prevFilters,
      global: { value, matchMode: FilterMatchMode.CONTAINS },
    }))
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
        <ExportToCSV data={gridData} />
        <Button
          label="Add New Rate"
          icon="pi pi-plus"
          className="p-button-success"
          style={{ height: '40px', fontSize: '14px', borderRadius: '4px', backgroundColor: '#198754', borderColor: '#198754', fontWeight: 500 }}
          onClick={openNew}
        />
      </div>
    </div>
  )

  const categoryFilterTemplate = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={categories.map((cat) => cat.Name)}
        onChange={(e) => {
          options.filterApplyCallback(e.value)
        }}
        placeholder="All"
        className="p-column-filter"
      />
    )
  }

  const itemFilterTemplate = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={items.map((item) => item.Name)}
        onChange={(e) => {
          options.filterApplyCallback(e.value)
        }}
        placeholder="All"
        className="p-column-filter"
      />
    )
  }

  const vendorFilterTemplate = (options) => {
    return (
      <Dropdown
        value={options.value}
        options={vendors.map((vendor) => vendor.Name)}
        onChange={(e) => {
          options.filterApplyCallback(e.value)
        }}
        placeholder="All"
        className="p-column-filter"
      />
    )
  }

  const viewRateCardDialogFooter = (
    <Button label="Close" icon="pi pi-times" onClick={hideViewDialog} className="p-button-secondary" />
  )

  const rateCardDialogFooter = (
    <React.Fragment>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
      <Button
        label={pageMode === "Add" ? "Create" : "Create"}
        icon="pi pi-check"
        className="p-button-text"
        onClick={saveRateCard}
      />
    </React.Fragment>
  )

  return (
    <div className="card">
      <>
        <Toast ref={toast} />
        <ConfirmDialog />
      </>
      <DataTable
        value={gridData}
        loading={loading}
        header={header}
        paginator
        rows={10}
        filters={filters}
        filterDisplay="row"
        globalFilter={globalFilterValue}
        emptyMessage="No rate cards found."
        dataKey="Id"
        globalFilterFields={["VendorName", "ItemName", "CategoryName"]}
        breakpoint="960px"
      >
        <Column
          field="VendorName"
          header="Vendor"
          sortable
          showFilterMenu={false}
          filter
          filterElement={vendorFilterTemplate}
        />
        <Column
          field="ItemName"
          header="Item"
          sortable
          showFilterMenu={false}
          filter
          filterElement={itemFilterTemplate}
        />
        <Column
          field="CategoryName"
          header="Category"
          sortable
          showFilterMenu={false}
          filter
          filterElement={categoryFilterTemplate}
        />
        <Column field="Price" header="Rate" body={(rowData) => `₹${rowData.Price}`} />
        <Column field="ValidTill" header=" Valid Till" body={(rowData) => formatDate(rowData.ValidTill)} />
        <Column header="Action" body={actionBodyTemplate} />
      </DataTable>

      <Dialog
        visible={isDialogVisible}
        style={{ width: "50vw" }}
        contentStyle={{ backgroundColor: "white" }}
        header={`${pageMode === "Add" ? "Add" : "Add"} Rate Card`}
        modal
        footer={rateCardDialogFooter}
        onHide={hideDialog}
        breakpoints={{ "960px": "80vw", "640px": "95vw" }}
      >
        <div className="row">
          <div className="col-12 md:col-6">
            <div className="mb-3">
              <label htmlFor="category">Category</label>
              <div className="mb-3">
                <div className="card flex justify-content-center">
                  <Dropdown
                    id="category"
                    onChange={onCategoryChange}
                    value={categories.find((cat) => cat.Id === rateCardData.CategoryId)}
                    options={categories}
                    optionLabel="Name"
                    placeholder="Select Category"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="mb-3">
              <label htmlFor="item">Item</label>
              <div className="mb-3">
                <div className="card flex justify-content-center">
                  <Dropdown
                    id="item"
                    value={filteredItems.find(item => item.Id === rateCardData.ItemId)}
                    onChange={onItemChange}
                    options={filteredItems}
                    optionLabel="Name"
                    placeholder="Select Item"
                    disabled={!rateCardData.CategoryId}
                  />
                </div>
              </div>
              {!rateCardData.CategoryId && <small className="p-error">Please select a category first.</small>}
              {rateCardData.CategoryId &&
                filteredItems.length === 0 && (
                  <small className="p-text-secondary">No items available for the selected category.</small>
                )}
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="mb-3">
              <label htmlFor="vendor">Vendor</label>
              <div className="mb-3">
                <div className="card flex justify-content-center">
                  <Dropdown
                    id="vendor"
                    value={vendors.find((ven) => ven.Id === rateCardData.VendorId)}
                    onChange={onVendorChange}
                    options={vendors}
                    optionLabel="Name"
                    placeholder="Select Vendor"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="mb-3">
              <label htmlFor="rate">Rate</label>
              <div className="p-inputgroup">
                <InputText
                  type="number"
                  id="rate"
                  value={rateCardData.Price}
                  onChange={(e) =>
                    setRateCardData({
                      ...rateCardData,
                      Price: e.target.value === "" ? "" : Number.parseFloat(e.target.value),
                    })
                  }
                />
                {items.find((item) => item.Id === rateCardData.ItemId) && (
                  <span className="p-inputgroup-addon">
                    /{items.find((item) => item.Id === rateCardData.ItemId).MeasurementUnit}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="col-12 md:col-6">
            <div className="mb-3">
              <label htmlFor="ValidTill">Valid Till</label>
              <div className="p-inputgroup">
                <Calendar
                  value={rateCardData.ValidTill ? new Date(rateCardData.ValidTill) : null}
                  dateFormat="dd/mm/yy"
                  onChange={(e) => setRateCardData({ ...rateCardData, ValidTill: e.value })}
                  showIcon
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={viewDialogVisible}
        style={{ width: "50vw" }}
        header="View Rate Card"
        modal
        footer={viewRateCardDialogFooter}
        onHide={hideViewDialog}
        breakpoints={{ "960px": "50vw", "640px": "95vw" }}
      >
        {selectedRateCard && (
          <div className="p-fluid">
            <div className="p-field">
              <label>Category</label>
              <InputText value={`${selectedRateCard.CategoryName}`} readOnly />
            </div>
            <div className="p-field">
              <label>Item</label>
              <InputText value={`${selectedRateCard.ItemName}`} readOnly />
            </div>
            <div className="p-field">
              <label>Vendor</label>
              <InputText value={`${selectedRateCard.VendorName}`} readOnly />
            </div>

            <div className="p-field">
              <label>Rate</label>
              <div className="p-inputgroup">
                <InputText value={`₹${selectedRateCard.Price}`} readOnly />
                {items.find((item) => item.Name === selectedRateCard.ItemName) && (
                  <span className="p-inputgroup-addon">
                    &nbsp;/{items.find((item) => item.Name === selectedRateCard.ItemName).MeasurementUnit}
                  </span>
                )}
              </div>
            </div>

            <div className="p-field">
              <label>Valid Till</label>
              <InputText value={`${formatDate(selectedRateCard.ValidTill)}`} readOnly />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}

export default RateCard
