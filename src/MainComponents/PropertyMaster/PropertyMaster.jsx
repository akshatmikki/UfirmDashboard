import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";

// PrimeReact
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import { AutoComplete } from "primereact/autocomplete";

// Services
import {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from "../../Services/PropertyService";

import { getAllClients } from "../../Services/ClientService";
import { getAllServices } from "../../Services/ServiceService";
import { getAllPropertyTypes } from "../../Services/PropertyTypeService";
import { getAllCities } from "../../Services/CityService";
import { getAllBranches } from "../../Services/BranchMaster";
import { createOrGetCity } from "../../Services/CityService";
import { getCountries, getStatesByCountry } from "../../Services/PayrollService";


export default function PropertyMaster() {
  const toast = useRef(null);
  const PropertyId = useSelector((state) => state.Commonreducer.puidn);

  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [branches, setBranches] = useState([]);

  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [cities, setCities] = useState([]);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);

  const [form, setForm] = useState({
    PropertyId: 0,
    PropertyTypeId: 0,
    Name: "",
    AddressLine1: "",
    AddressLine12: "",
    CityId: null,
    ContactNumber: "",
    Landmark: "",
    Pincode: "",
    State: "",
    Latitude: "",
    Longitude: "",
    ShiftHour: 0,
    TotalWorkingDays: 0,
    ClientID: 0,
    ServiceIds: [],
    BranchCode: 0,

    // NEW (ADDED)
    SalaryCycleDayFrom: 1,
    SalaryCycleDayTo: 30,
    ExcludeSunday: false,
    MonthSundays: 0,

    CreatedBy: 1,
    IsActive: 1,
  });
  const [showForm, setShowForm] = useState(false);
  const [filteredCities, setFilteredCities] = useState([]);
  const searchCity = (event) => {
    const query = event.query.toLowerCase();

    const filtered = cities.filter(city =>
      city.label.toLowerCase().includes(query)
    );

    setFilteredCities(filtered);
  };

  // ---------------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------------
  const loadData = async () => {
    setLoading(true);

    let propertyList = [];
    let clientList = [];
    let serviceList = [];
    let cityList = [];
    let propertyTypeList = [];
    let branchList = [];

    // 1️⃣ Property loading logic
    try {
      if (PropertyId && PropertyId > 0) {
        const result = await getPropertyById(PropertyId);
        propertyList = [result];
      } else {
        propertyList = await getAllProperties();
      }
    } catch (err) {
      console.log("Property fetch failed", err);
    }

    // 2️⃣ Clients
    try {
      clientList = await getAllClients();
      setClients(
        clientList.map((c) => ({
          label: c.ClientName,
          value: c.ClientID,
        }))
      );
    } catch {
      console.log("Client fetch failed");
    }

    // 3️⃣ Services
    try {
      serviceList = await getAllServices();
      setServices(
        serviceList.map((s) => ({
          label: s.ServiceName,
          value: s.ServiceId,
        }))
      );
    } catch { }

    // 4️⃣ Cities
    try {
      cityList = await getAllCities();
      setCities(
        cityList.map((ct) => ({
          label: ct.CityName,
          value: ct.CityId,
        }))
      );
    } catch { }

    // 5️⃣ Property Types
    try {
      propertyTypeList = await getAllPropertyTypes();
      setPropertyTypes(
        propertyTypeList.map((pt) => ({
          label: pt.PropertyType,
          value: pt.PropertyTypeId,
        }))
      );
    } catch { }

    // 6️⃣ Branches
    try {
      branchList = await getAllBranches();
      setBranches(
        branchList
          .filter((b) => b.IsActive)
          .map((b) => ({
            label: b.BranchName,
            value: b.BranchCode,
          }))
      );
    } catch {
      console.log("Branch fetch failed");
    }

    // 🔥 7️⃣ ENRICH PROPERTIES (this is the upgrade)
    const enriched = propertyList.map((p) => ({
      ...p,
      ClientName:
        clientList.find((c) => c.ClientID === p.ClientID)?.ClientName || "—",
      BranchName:
        branchList.find((b) => b.BranchCode === p.BranchCode)?.BranchName || "—",
      CityName:
        cityList.find((c) => c.CityId === p.CityId)?.CityName || "—",
      PropertyTypeName:
        propertyTypeList.find(
          (pt) => pt.PropertyTypeId === p.PropertyTypeId
        )?.PropertyType || "—",
    }));

    setProperties(enriched);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [PropertyId]);

  // ---------------------------------------------------------
  // CREATE
  // ---------------------------------------------------------
  const openCreateDialog = () => {
    setForm({
      PropertyId: 0,
      PropertyTypeId: 0,
      Name: "",
      AddressLine1: "",
      AddressLine12: "",
      CityId: null,
      ContactNumber: "",
      Landmark: "",
      Pincode: "",
      State: "",
      Latitude: "",
      Longitude: "",
      ShiftHour: 0,
      TotalWorkingDays: 0,
      ClientID: 0,
      ServiceIds: [],
      BranchCode: 0,

      // ✅ KEEP NEW FIELDS
      SalaryCycleDayFrom: 1,
      SalaryCycleDayTo: 30,
      ExcludeSunday: false,
      MonthSundays: 0,

      CreatedBy: 1,
      IsActive: 1,
    });

    setEditId(null);
    setShowForm(true); // ✅ THIS IS IMPORTANT
  };

  // ---------------------------------------------------------
  // EDIT
  // ---------------------------------------------------------
  const openEditDialog = async (row) => {
    setEditId(row.PropertyId);

    try {
      const data = await getPropertyById(row.PropertyId);

      setForm({
        PropertyId: data.PropertyId,
        PropertyTypeId: data.PropertyTypeId,
        Name: data.Name,
        AddressLine1: data.AddressLine1,
        AddressLine12: data.AddressLine12,
        CityId: data.CityId,
        ContactNumber: data.ContactNumber,
        Landmark: data.Landmark,
        Pincode: data.Pincode,
        State: data.State,
        Latitude: data.Latitude,
        Longitude: data.Longitude,
        ShiftHour: data.ShiftHours || 0,
        TotalWorkingDays: data.TotalWorkingDays || 0,
        ClientID: data.ClientID || 0,
        BranchCode: data.BranchCode ?? 0,
        ServiceIds: data.ServiceIds || [],

        // ✅ MAP NEW FIELDS
        SalaryCycleDayFrom: data.Salarycycledayfrom ?? 1,
        SalaryCycleDayTo: data.Salarycycledayto ?? 30,
        ExcludeSunday: data.Excludesunday === true,
        MonthSundays: data.MonthSunday ?? 0,

        CreatedBy: data.CreatedBy,
        IsActive: 1,
      });

      setShowForm(true); // ✅ ADD THIS

    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load property details",
      });
    }
  };

  // ---------------------------------------------------------
  // VIEW (READ ONLY)
  // ---------------------------------------------------------
  const openViewDialog = async (row) => {
    try {
      const data = await getPropertyById(row.PropertyId);

      const cityObj = cities.find((c) => c.value === data.CityId);

      setViewData({
        ...data,
        SalaryCycleDayFrom: data.Salarycycledayfrom,
        SalaryCycleDayTo: data.Salarycycledayto,
        ExcludeSunday: data.Excludesunday,
        MonthSundays: data.MonthSunday,
        CityName: cityObj ? cityObj.label : "—",
      });

      setViewDialogVisible(true);
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Failed to load property details",
      });
    }
  };

  // ---------------------------------------------------------
  // SAVE
  // ---------------------------------------------------------
  const handleSave = async () => {
    if (!form.Name || form.Name.trim() === "") {
      toast.current.show({
        severity: "error",
        summary: "Validation Error",
        detail: "Property Name is required",
      });
      return;
    }

    if (!form.State || form.State.trim() === "") {
      toast.current.show({
        severity: "error",
        summary: "Validation Error",
        detail: "State is required",
      });
      return;
    }

    // City check (handles both select + typed)
    if (!form.CityId || form.CityId === "" || form.CityId === 0) {
      toast.current.show({
        severity: "error",
        summary: "Validation Error",
        detail: "City is required",
      });
      return;
    }

    // 🔥 DUPLICATE PROPERTY NAME CHECK
    const newNameNormalized = normalizeText(form.Name);

    const isDuplicate = properties.some((p) => {
      const existingNameNormalized = normalizeText(p.Name);

      // allow same record in edit mode
      if (editId && p.PropertyId === editId) return false;

      return existingNameNormalized === newNameNormalized;
    });

    if (isDuplicate) {
      toast.current.show({
        severity: "error",
        summary: "Duplicate Error",
        detail: "Property with similar name already exists!",
      });
      return;
    }

    try {
      let finalCityId = form.CityId;

      // 🔥 If user typed a city (string instead of number)
      if (typeof form.CityId === "string") {
        const selectedState = states.find(s => s.value === form.State);

        if (!selectedState) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Please select state before city",
          });
          return;
        }

        const stateId = selectedState?.id;

        const res = await createOrGetCity({
          CityName: form.CityId.trim(), // 🔥 trim fix
          StateId: stateId,
          CreatedBy: 1,
        });

        finalCityId = res.CityId;

        // 🔥 update local city list
        setCities(prev => [
          ...prev,
          { label: form.CityId.trim(), value: res.CityId }
        ]);
      }

      const finalForm = {
        ...form,
        Name: form.Name.trim(), // 🔥 trim fix
        State: form.State.trim(), // 🔥 trim fix
        CityId: finalCityId,
      };

      if (editId) {
        await updateProperty(editId, finalForm);
        toast.current.show({
          severity: "success",
          summary: "Updated",
          detail: "Property updated",
        });
      } else {
        await createProperty(finalForm);
        toast.current.show({
          severity: "success",
          summary: "Created",
          detail: "Property created",
        });
      }

      setShowForm(false);
      loadData();

    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Save failed",
      });
    }
  };

  // ---------------------------------------------------------
  // DELETE
  // ---------------------------------------------------------
  const handleDelete = async (row) => {
    if (!window.confirm("Are you sure you want to delete this?")) return;

    await deleteProperty(row.PropertyId);

    toast.current.show({
      severity: "success",
      summary: "Deleted",
      detail: "Property removed",
    });

    loadData();
  };

  // ---------------------------------------------------------
  // FILTER SEARCH
  // ---------------------------------------------------------
  const filteredData = properties.filter((p) => {
    const k = searchText.toLowerCase();
    return (
      p.Name?.toLowerCase().includes(k) ||
      p.State?.toLowerCase().includes(k) ||
      p.Pincode?.toLowerCase().includes(k)
    );
  });

  // ---------------------------------------------------------
  // DIALOG FOOTER
  // ---------------------------------------------------------
  const dialogFooter = (
    <div className="text-end">
      <Button
        label="Cancel"
        className="p-button-text me-2"
        onClick={() => setShowForm(false)}
      />
      <Button label="Save" className="p-button-primary" onClick={handleSave} />
    </div>
  );

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showForm]);

  const normalizeText = (str) => {
    return str
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  };

  useEffect(() => {
    const loadLocationData = async () => {
      try {
        const countryData = await getCountries();

        const mappedCountries = countryData.map(c => ({
          label: c.Name,
          value: c.CountryId
        }));

        setCountries(mappedCountries);

        // Auto load India states (since only India exists)
        if (mappedCountries.length > 0) {
          loadStates(mappedCountries[0].value);
        }

      } catch (err) {
        console.log("Country fetch failed", err);
      }
    };

    loadLocationData();
  }, []);

  const loadStates = async (countryId) => {
    try {
      const stateData = await getStatesByCountry(countryId);

      const mappedStates = stateData.map(s => ({
        label: s.StateName,
        value: s.StateName,
        id: s.StateId,  // IMPORTANT: you are storing string in DB
      }));

      setStates(mappedStates);

    } catch (err) {
      console.log("State fetch failed", err);
    }
  };

  const exportToExcel = () => {
    const headers = [
      "Property Name",
      "Type",
      "Contact",
      "Address",
      "State",
      "Pincode",
      "City",
      "Client",
      "Branch"
    ];

    const rows = filteredData.map((p) => [
      p.Name ?? "",
      p.PropertyTypeName ?? "",
      p.ContactNumber ? `="${p.ContactNumber}"` : "",
      p.AddressLine1 ?? "",
      p.State ?? "",
      p.Pincode ?? "",
      p.CityName ?? "",
      p.ClientName ?? "",
      p.BranchName ?? ""
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) =>
          row
            .map((value) =>
              `"${String(value).replace(/"/g, '""')}"`
            )
            .join(",")
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "PropertyMaster.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="content-wrapper" style={{ padding: 30 }}>
      <Toast ref={toast} />

      <div
        className="card"
        style={{ borderRadius: 10, maxWidth: 1400, margin: "0 auto" }}
      >
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h2>Property Master</h2>
          <div className="d-flex align-items-center">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ maxWidth: 240, height: "38px" }}
            />

            <button
              className="btn btn-outline-primary me-2 d-flex align-items-center justify-content-center shadow-sm"
              style={{
                height: "38px",
                padding: "0 14px",
                gap: "6px",
                whiteSpace: "nowrap"
              }}
              onClick={exportToExcel}
            >
              <i className="fa fa-download"></i>
              <span>Export</span>
            </button>

            <button
              className="btn btn-success d-flex align-items-center justify-content-center"
              style={{ height: "38px", padding: "0 18px", gap: "6px" }}
              onClick={openCreateDialog}
            >
              <i className="pi pi-plus"></i>
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive p-3">
          <DataTable
            value={filteredData}
            loading={loading}
            paginator
            rows={8}
            stripedRows
          >
            <Column field="Name" header="Property Name" sortable />
            <Column field="PropertyTypeName" header="Type" />
            <Column field="ContactNumber" header="Contact" />
            <Column field="AddressLine1" header="Address" />
            <Column field="State" header="State" />
            <Column field="Pincode" header="Pincode" />
            <Column field="CityName" header="City" />
            <Column field="ClientName" header="Client" />
            <Column field="BranchName" header="Branch" />

            <Column
              header="Actions"
              body={(row) => (
                <>
                  <Button
                    icon="pi pi-eye"
                    className="p-button-sm p-button-secondary me-2"
                    onClick={() => openViewDialog(row)}
                  />
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-sm p-button-info me-2"
                    onClick={() => openEditDialog(row)}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-sm p-button-danger"
                    onClick={() => handleDelete(row)}
                  />
                </>
              )}
            />
          </DataTable>
        </div>

        {/* CREATE/EDIT DIALOG */}
        <Dialog
          header={editId ? "Edit Property" : "Create Property"}
          visible={showForm}
          modal
          style={{ width: "95vw" }}
          contentStyle={{
            maxHeight: "80vh",
            overflowY: overlayOpen ? "hidden" : "auto"
          }}
          onHide={() => setShowForm(false)}
        >
          <div className="row g-4">
            {/* LEFT COLUMN */}
            <div className="col-md-6">
              <div className="card p-3 shadow-sm">
                <h5 className="mb-3">Property Details</h5>

                <label>Property Type</label>
                <Dropdown
                  value={form.PropertyTypeId}
                  options={propertyTypes}
                  onShow={() => setOverlayOpen(true)}
                  onHide={() => setOverlayOpen(false)}
                  className="w-100 mb-2"
                  onChange={(e) =>
                    setForm({ ...form, PropertyTypeId: e.value })
                  }
                />

                <label>Property Name*</label>
                <InputText
                  className="w-100 mb-2"
                  value={form.Name}
                  onChange={(e) => setForm({ ...form, Name: e.target.value })}
                />

                <label>Address Line 1</label>
                <InputText
                  className="w-100 mb-2"
                  value={form.AddressLine1}
                  onChange={(e) =>
                    setForm({ ...form, AddressLine1: e.target.value })
                  }
                />

                <label>Address Line 2</label>
                <InputText
                  className="w-100 mb-2"
                  value={form.AddressLine12}
                  onChange={(e) =>
                    setForm({ ...form, AddressLine12: e.target.value })
                  }
                />

                <label>City*</label>
                <AutoComplete
                  value={
                    typeof form.CityId === "number"
                      ? cities.find(c => c.value === form.CityId)
                      : form.CityId
                  }
                  suggestions={filteredCities}
                  completeMethod={searchCity}
                  field="label"
                  dropdown
                  className="w-100 mb-2"
                  placeholder="Type or select city"
                  onChange={(e) => setForm({ ...form, CityId: e.value })}
                  onSelect={(e) => setForm({ ...form, CityId: e.value.value })}
                />

                <label>Contact Number</label>
                <InputText
                  className="w-100 mb-2"
                  value={form.ContactNumber}
                  onChange={(e) =>
                    setForm({ ...form, ContactNumber: e.target.value })
                  }
                />

                <label>Landmark</label>
                <InputText
                  className="w-100 mb-2"
                  value={form.Landmark}
                  onChange={(e) =>
                    setForm({ ...form, Landmark: e.target.value })
                  }
                />

                <label>Pincode</label>
                <InputText
                  className="w-100 mb-2"
                  value={form.Pincode}
                  onChange={(e) =>
                    setForm({ ...form, Pincode: e.target.value })
                  }
                />

                <label>State*</label>
                <Dropdown
                  className="w-100 mb-2"
                  value={form.State}
                  options={states}
                  placeholder="Select State"
                  filter
                  onShow={() => setOverlayOpen(true)}
                  onHide={() => setOverlayOpen(false)}
                  onChange={(e) => setForm({ ...form, State: e.value })}
                />

                <label>Country</label>
                <Dropdown
                  value={1}
                  options={countries}
                  disabled   // since only India
                  className="w-100 mb-2"
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="col-md-6">
              <div className="card p-3 shadow-sm">
                <h5 className="mb-3">Operational & Payroll</h5>

                <label>Client</label>
                <Dropdown
                  className="w-100 mb-2"
                  value={form.ClientID}
                  options={clients}
                  onShow={() => setOverlayOpen(true)}
                  onHide={() => setOverlayOpen(false)}
                  onChange={(e) => setForm({ ...form, ClientID: e.value })}
                />

                <label>Branch Name</label>
                <Dropdown
                  className="w-100 mb-2"
                  value={form.BranchCode}
                  options={branches}
                  onShow={() => setOverlayOpen(true)}
                  onHide={() => setOverlayOpen(false)}
                  placeholder="Select Branch"
                  onChange={(e) =>
                    setForm({ ...form, BranchCode: e.value })
                  }
                />

                <label>Services</label>
                <MultiSelect
                  className="w-100"
                  value={form.ServiceIds}
                  options={services}
                  filter
                  display="chip"
                  onShow={() => setOverlayOpen(true)}
                  onHide={() => setOverlayOpen(false)}
                  onChange={(e) => setForm({ ...form, ServiceIds: e.value })}
                />

                <label>Latitude</label>
                <InputText
                  className="w-100 mb-2"
                  value={form.Latitude}
                  onChange={(e) =>
                    setForm({ ...form, Latitude: e.target.value })
                  }
                />

                <label>Longitude</label>
                <InputText
                  className="w-100 mb-2"
                  value={form.Longitude}
                  onChange={(e) =>
                    setForm({ ...form, Longitude: e.target.value })
                  }
                />

                {/* <label>Shift Hours</label>
                <InputText
                  type="number"
                  className="w-100 mb-2"
                  value={form.ShiftHour}
                  onChange={(e) =>
                    setForm({ ...form, ShiftHour: Number(e.target.value) })
                  }
                />

                <label>Total Working Days</label>
                <InputText
                  type="number"
                  className="w-100 mb-2"
                  value={form.TotalWorkingDays}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      TotalWorkingDays: Number(e.target.value),
                    })
                  }
                />

                <hr />

                <label>Salary Cycle Day From</label>
                <InputText
                  type="number"
                  className="w-100 mb-2"
                  value={form.SalaryCycleDayFrom}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      SalaryCycleDayFrom: Number(e.target.value),
                    })
                  }
                />

                <label>Salary Cycle Day To</label>
                <InputText
                  type="number"
                  className="w-100 mb-2"
                  value={form.SalaryCycleDayTo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      SalaryCycleDayTo: Number(e.target.value),
                    })
                  }
                /> */}

                {/* <div className="mb-2">
                  <input
                    type="checkbox"
                    checked={form.ExcludeSunday}
                    onChange={(e) =>
                      setForm({ ...form, ExcludeSunday: e.target.checked })
                    }
                  />
                  <span className="ms-2">Exclude Sundays</span>
                </div> */}

                {/* <label>Monthly Sundays</label>
                <InputText
                  type="number"
                  className="w-100 mb-2"
                  value={form.MonthSundays}
                  onChange={(e) =>
                    setForm({ ...form, MonthSundays: Number(e.target.value) })
                  }
                /> */}
              </div>
            </div>

            {/* ACTIONS */}
            <div className="col-12 text-end">
              <Button
                label="Cancel"
                className="p-button-text me-2"
                onClick={() => setShowForm(false)}
              />
              <Button
                label="Save Property"
                icon="pi pi-save"
                onClick={handleSave}
              />
            </div>
          </div>
        </Dialog>

        {/* VIEW ONLY DIALOG */}
        <Dialog
          header="Property Details"
          visible={viewDialogVisible}
          modal
          style={{ width: "900px" }}
          onHide={() => setViewDialogVisible(false)}
        >
          {viewData && (
            <div className="container-fluid">

              {/* 🔹 BASIC */}
              <div className="card p-3 mb-3 shadow-sm">
                <h5 className="mb-3 text-primary">Basic Details</h5>
                <div className="row">
                  <div className="col-md-6"><strong>Name:</strong> {viewData.Name}</div>
                  <div className="col-md-6"><strong>Type:</strong> {
                    propertyTypes.find(pt => pt.value === viewData.PropertyTypeId)?.label
                  }</div>
                </div>
              </div>

              {/* 🔹 ADDRESS */}
              <div className="card p-3 mb-3 shadow-sm">
                <h5 className="mb-3 text-primary">Address</h5>
                <div className="row">
                  <div className="col-md-6"><strong>Address 1:</strong> {viewData.AddressLine1}</div>
                  <div className="col-md-6"><strong>Address 2:</strong> {viewData.AddressLine12}</div>
                  <div className="col-md-4"><strong>City:</strong> {viewData.CityName}</div>
                  <div className="col-md-4"><strong>State:</strong> {viewData.State}</div>
                  <div className="col-md-4"><strong>Country:</strong> India</div>
                  <div className="col-md-4"><strong>Pincode:</strong> {viewData.Pincode}</div>
                  <div className="col-md-4"><strong>Landmark:</strong> {viewData.Landmark}</div>
                  <div className="col-md-4"><strong>Contact:</strong> {viewData.ContactNumber}</div>
                </div>
              </div>

              {/* 🔹 LOCATION */}
              <div className="card p-3 mb-3 shadow-sm">
                <h5 className="mb-3 text-primary">Location</h5>
                <div className="row">
                  <div className="col-md-6"><strong>Latitude:</strong> {viewData.Latitude}</div>
                  <div className="col-md-6"><strong>Longitude:</strong> {viewData.Longitude}</div>
                </div>
              </div>

              {/* 🔹 OPERATIONAL DETAILS */}
              {/* 
<div className="card p-3 mb-3 shadow-sm">
  <h5 className="mb-3 text-primary">Operational Details</h5>
  <div className="row">
    <div className="col-md-6">
      <strong>Shift Hours:</strong> {viewData.ShiftHours || "—"}
    </div>
    <div className="col-md-6">
      <strong>Total Working Days:</strong> {viewData.TotalWorkingDays || "—"}
    </div>
  </div>
</div>
*/}

              {/* 🔹 PAYROLL SETTINGS */}
              {/*
<div className="card p-3 mb-3 shadow-sm">
  <h5 className="mb-3 text-primary">Payroll Settings</h5>
  <div className="row">
    <div className="col-md-6">
      <strong>Salary Cycle From:</strong> {viewData.SalaryCycleDayFrom || "—"}
    </div>
    <div className="col-md-6">
      <strong>Salary Cycle To:</strong> {viewData.SalaryCycleDayTo || "—"}
    </div>
    <div className="col-md-6">
      <strong>Exclude Sundays:</strong> {viewData.ExcludeSunday ? "Yes" : "No"}
    </div>
    <div className="col-md-6">
      <strong>Monthly Sundays:</strong> {viewData.MonthSundays || "—"}
    </div>
  </div>
</div>
*/}

              {/* 🔹 CLIENT & SERVICES */}
              <div className="card p-3 shadow-sm">
                <h5 className="mb-3 text-primary">Client & Services</h5>

                <div className="mb-2">
                  <strong>Client:</strong> {clients.find(c => c.value === viewData.ClientID)?.label}
                </div>

                <div className="mb-2">
                  <strong>Branch:</strong> {branches.find(b => b.value === viewData.BranchCode)?.label || "—"}
                </div>

                <div>
                  <strong>Services:</strong>{" "}
                  {viewData.ServiceIds?.length
                    ? viewData.ServiceIds.map(id =>
                      services.find(s => s.value === id)?.label
                    ).join(", ")
                    : "—"}
                </div>
              </div>

            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
}
