"use client"
import React, { useState, useEffect, useCallback } from "react"
import swal from "sweetalert"
import { ToastContainer } from "react-toastify"
import DataGrid from "../../ReactComponents/DataGrid/DataGrid.jsx"
import Button from "../../ReactComponents/Button/Button"
import { CreateValidator, ValidateControls } from "../Calendar/Validation"
import * as appCommon from "../../Common/AppCommon.js"
import { DELETE_CONFIRMATION_MSG } from "../../Contants/Common"
import { getVendors, getVendorById, createVendor, updateVendor, deleteVendor, PendingApprovalVendor } from "../../Services/InventoryService"
import { useSelector, useDispatch } from "react-redux"
import ExportToCSV from "../../ReactComponents/ExportToCSV/ExportToCSV.js"
import ApprovalPage from "./ApprovalPage";

const Vendor = (props) => {
  const [pageMode, setPageMode] = useState("Home")
  const [openDropDown, setOpenDropDown] = useState(false)
  const [gridData, setGridData] = useState([])
  const [GridApproval, setGridApproval]= useState([])
  const gridHeader = [
    { sTitle: "Id", titleValue: "Id", orderable: true },
    { sTitle: "Name", titleValue: "Name" },
    { sTitle: "Contact Person", titleValue: "ContactPerson" },
    { sTitle: "Contact Number", titleValue: "ContactNumber" },
    { sTitle: "Email", titleValue: "Email" },
    { sTitle: "Action", titleValue: "Action", Action: "Edit&View&Delete", Index: "0", orderable: false },
  ]
  const propertyId = useSelector((state) => state.Commonreducer.puidn)
  const userId = useSelector((state) => state.Commonreducer.userId)
  const emptyVendorData = {
    Id: 0,
    Name: "",
    ContactPerson: "",
    ContactNumber: "",
    Email: "",
    Address: "",
    GSTNumber: "",
    PANNumber: "",
    PANFileUrl: "",
    GSTCertificateUrl: "",
    BrochureUrl: "",
    WebsiteUrl: "",
    PropertyId: propertyId,
    IsApproved: false
  }
  const [VendorData, setVendorData] = useState(emptyVendorData)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const dispatch = useDispatch()

  const [selectedPANFile, setSelectedPANFile] = useState(null)
  const [selectedGSTFile, setSelectedGSTFile] = useState(null)
  const [selectedBrochureFile, setSelectedBrochureFile] = useState(null)

  const handleFileChange = (e) => {
    const { id, files } = e.target
    const file = files[0]
    if (file) {
      switch (id) {
        case "PANFileUrl":
          setSelectedPANFile(file)
          break
        case "GSTCertificateUrl":
          setSelectedGSTFile(file)
          break
        case "BrochureUrl":
          setSelectedBrochureFile(file)
          break
        default:
          break
      }
    } else {
      switch (id) {
        case "PANFileUrl":
          setSelectedPANFile(null)
          break
        case "GSTCertificateUrl":
          setSelectedGSTFile(null)
          break
        case "BrochureUrl":
          setSelectedBrochureFile(null)
          break
        default:
          break
      }
    }
  }

  const handleCreateVendor = async (newVendor) => {
    try {
      const formData = new FormData();
      formData.append("PropertyId", propertyId);
      formData.append("Name", newVendor.Name);
      formData.append("ContactPerson", newVendor.ContactPerson);
      formData.append("ContactNumber", newVendor.ContactNumber);
      formData.append("Email", newVendor.Email);
      formData.append("Address", newVendor.Address);
      formData.append("GSTNumber", newVendor.GSTNumber);
      formData.append("PANNumber", newVendor.PANNumber);
      formData.append("WebsiteUrl", newVendor.WebsiteUrl || "");
      formData.append("CreatedBy", userId || 1);

      if (selectedPANFile) formData.append("pan", selectedPANFile);
      if (selectedGSTFile) formData.append("gst", selectedGSTFile);
      if (selectedBrochureFile) formData.append("brochure", selectedBrochureFile);

      await createVendor(formData);
      appCommon.showtextalert("Vendor Saved Successfully!", "", "success");
      handleCancel();
      await getVendorList(propertyId);
    } catch (error) {
      appCommon.showtextalert("Error Creating Vendor", error.message, "error");
    }
  };

  const handleUpdateVendor = async (id, updatedVendor) => {
    try {
      const formData = new FormData();
      formData.append("Id", id);
      formData.append("PropertyId", propertyId);
      formData.append("Name", updatedVendor.Name);
      formData.append("ContactPerson", updatedVendor.ContactPerson);
      formData.append("ContactNumber", updatedVendor.ContactNumber);
      formData.append("Email", updatedVendor.Email);
      formData.append("Address", updatedVendor.Address);
      formData.append("GSTNumber", updatedVendor.GSTNumber);
      formData.append("PANNumber", updatedVendor.PANNumber);
      formData.append("WebsiteUrl", updatedVendor.WebsiteUrl || "");
      formData.append("CreatedBy", userId || 1);
      formData.append("IsApproved", updatedVendor.IsApproved ? "true" : "false");

      if (selectedPANFile) formData.append("pan", selectedPANFile);
      if (selectedGSTFile) formData.append("gst", selectedGSTFile);
      if (selectedBrochureFile) formData.append("brochure", selectedBrochureFile);

      await updateVendor(id, formData);
      appCommon.showtextalert("Vendor Updated Successfully!", "", "success")
      handleCancel()
      await getVendorList(propertyId)
    } catch (error) {
      appCommon.showtextalert("Error Updating Vendor", error.message, "error")
    }
  }

  const getVendorApproval = useCallback(async (propertyId) => {
    try {
      setLoading(true)
      const data = await PendingApprovalVendor(propertyId)
      setGridApproval(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching Vendors:", error)
      setLoading(false)
    }
  }, [])

  const getVendorList = useCallback(async (propertyId) => {
    try {
      setLoading(true)
      const data = await getVendors(propertyId)
      setGridData(data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching Vendors:", error)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (propertyId) {
      setGridApproval([])
      setGridData([])
      getVendorApproval(propertyId)
      getVendorList(propertyId)
    } else {
      setGridApproval([])
      setGridData([])
      appCommon.showtextalert("Error", "Please select a Property.", "error")
    }
  }, [getVendorApproval,getVendorList, propertyId])

  const handleViewVendor = async (id) => {
    try {
      const data = await getVendorById(id)
      setVendorData(data)
    } catch (error) {
      appCommon.showtextalert("Error viewing Vendor", error.message, "error")
    }
  }

  const handleDeleteVendor = async (id) => {
    try {
      await deleteVendor(id)
      appCommon.showtextalert("Vendor Deleted Successfully!", "", "success")
      await getVendorList(propertyId)
    } catch (error) {
      appCommon.showtextalert("Error Deleting Vendor", error.message, "error")
    }
  }

  const onPagechange = (page) => {
  }

 const onGridApprove = async (VendorApprovedId) => {
         try {
             const approvedVendor = GridApproval.find(item => item.Id === VendorApprovedId);
             if (approvedVendor) {
                 const updatedVendor = { ...approvedVendor, IsApproved: true };
                 await updateVendor(updatedVendor.Id, updatedVendor);
                 appCommon.showtextalert("Vendor Approved Successfully!", "", "success");
                 setGridApproval(prevData => prevData.filter(item => item.Id !== VendorApprovedId));
                 await getVendorList(propertyId);
             }
         } catch (error) {
             appCommon.showtextalert("Error Approving Vendor", error.message, "error");
             console.error("Error approving vendor:", error);
         }
     };

  const onGridDelete = (VendorData) => {
    const myhtml = document.createElement("div")
    myhtml.innerHTML = DELETE_CONFIRMATION_MSG + "</hr>"
    swal({
      buttons: {
        ok: "Yes",
        cancel: "No",
      },
      content: myhtml,
      icon: "warning",
      closeOnClickOutside: false,
      dangerMode: true,
    }).then((value) => {
      switch (value) {
        case "ok":
          handleDeleteVendor(VendorData)
          break
        case "cancel":
        default:
          break
      }
    })
  }

  const onGridView = async (VendorData) => {
    setPageMode("View")
    CreateValidator()
    try {
      handleViewVendor(VendorData)
    } catch (error) {
      console.error("Error fetching Vendor details", error)
      appCommon.showtextalert("Error", "Failed to fetch Vendor details.", "error")
    }
  }

  const onGridEdit = async (VendorData) => {
    setPageMode("Edit")
    CreateValidator()
    try {
      const VendorDetails = await getVendorById(VendorData)
      console.log("VendorDetails", VendorDetails)
      setVendorData(VendorDetails)
      setSelectedFile(null) // Reset selected file when editing
    } catch (error) {
      console.error("Error fetching Vendor details", error)
      appCommon.showtextalert("Error", "Failed to fetch Vendor details.", "error")
    }
  }

  const Addnew = () => {
    setPageMode("Add")
    CreateValidator()
    setVendorData(emptyVendorData)
    setSelectedFile(null) // Reset selected file when adding new
  }

  const DropDown = () => {
    setOpenDropDown(!openDropDown)
  }

  const handleCancel = () => {
    setPageMode("Home")
    setVendorData(emptyVendorData)
    setSelectedFile(null)
    getVendorList(propertyId)
    setOpenDropDown(false)
  }

  const handleInputChange = (e) => {
    let { id, value } = e.target
    if (id === "GSTNumber" || id === "PANNumber") {
      value = value.replace(/[^a-zA-Z0-9]/g, "")
    }
    setVendorData((prevState) => ({
      ...prevState,
      [id]: value,
    }))
  }

  const handleSave = async () => {
    if (!ValidateControls()) {
      appCommon.showtextalert("Validation Error", "Please fill in all required fields correctly.", "error")
      return
    }
    if (pageMode === "Add") {
      await handleCreateVendor(VendorData)
    } else if (pageMode === "Edit") {
      await handleUpdateVendor(VendorData.Id, VendorData)
    }
  }

  const viewDocument = () => {
    if(VendorData.PANFileUrl && VendorData.PANFileUrl !== "") {
      window.open(VendorData.PANFileUrl, "_blank")
    } else if (VendorData.GSTCertificateUrl && VendorData.GSTCertificateUrl !== "") {
      window.open(VendorData.GSTCertificateUrl, "_blank")
    } else if (VendorData.BrochureUrl && VendorData.BrochureUrl !== "") {
      window.open(VendorData.BrochureUrl, "_blank")
    } else{
      appCommon.showtextalert("Error", "No document available to view.", "error")
    }
  }

  return (
    <>
      <style>{`
        .custom-transparent-scrollbar {
          max-height: calc(100vh - 200px) !important;
          overflow-y: auto !important;
          scrollbar-width: thin !important;
          scrollbar-color: rgba(0, 0, 0, 0.15) transparent !important;
        }
        .custom-transparent-scrollbar::-webkit-scrollbar {
          width: 6px !important;
          height: 6px !important;
        }
        .custom-transparent-scrollbar::-webkit-scrollbar-track {
          background: transparent !important;
        }
        .custom-transparent-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.15) !important;
          border-radius: 3px !important;
        }
        .custom-transparent-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>
      <div className="row">
                <div className="col-12">
                    {GridApproval.length > 0 && pageMode === "Home" && (
                        <ApprovalPage
                            title={"Pending For Approval"}
                            gridHeader={gridHeader}
                            gridData={GridApproval}
                            onGridEdit={onGridEdit}
                            onGridDelete={onGridDelete}
                            onGridApprove={onGridApprove}
                            onGridView={onGridView}
                        />
                    )}
                </div>
            </div>
      {pageMode === "Home" && (
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header d-flex p-0">
                <ul className="nav ml-auto tableFilterContainer">
                  <li className="nav-item">
                    <div className="input-group input-group-sm">
                      <div className="input-group-prepend">
                        <ExportToCSV data={gridData} className="btn btn-success btn-sm rounded mr-2" />
                        <Button
                          id="btnaddCalendarFrequency"
                          Action={Addnew}
                          ClassName="btn btn-success btn-sm rounded"
                          Icon={<i className="fa fa-plus" aria-hidden="true"></i>}
                          Text="Add Vendor"
                        />
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="card-body pt-2">
                <DataGrid
                  Id="VendorDataGrid"
                  IsPagination={false}
                  ColumnCollection={gridHeader}
                  Onpageindexchanged={onPagechange}
                  onEditMethod={onGridEdit}
                  onGridDeleteMethod={onGridDelete}
                  onGridViewMethod={onGridView}
                  IsSarching="false"
                  GridData={gridData}
                  pageSize="2000"
                />
              </div>
            </div>
          </div>
        </div>
      )}
      {(pageMode === "Add" || pageMode === "Edit") && (
        <div className="modal d-flex align-items-center justify-content-center show" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="exampleModalToggleLabel">
                  {pageMode === "Add" ? "Add Vendor" : "Edit Vendor"}
                </h5>
              </div>
              <div className="modal-body p-2 custom-transparent-scrollbar">
                <form>
                  <div className="row">
                    <div className="col-sm-6">
                      <label htmlFor="Name">Vendor Name</label>
                      <input
                        id="Name"
                        required
                        placeholder="Enter Vendor Name"
                        type="text"
                        className="form-control"
                        value={VendorData.Name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label>Contact Person</label>
                      <input
                        id="ContactPerson"
                        required
                        placeholder="Enter Description"
                        type="text"
                        className="form-control"
                        value={VendorData.ContactPerson}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label>Contact Number</label>
                      <input
                        id="ContactNumber"
                        required
                        placeholder="Enter Contact Number"
                        type="number"
                        maxLength="10"
                        className="form-control"
                        value={VendorData.ContactNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label>Email</label>
                      <input
                        id="Email"
                        required
                        placeholder="Enter Email"
                        type="text"
                        className="form-control"
                        value={VendorData.Email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label>Address</label>
                      <input
                        id="Address"
                        required
                        placeholder="Enter Address"
                        type="text"
                        className="form-control"
                        value={VendorData.Address}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label>GST Number</label>
                      <input
                        id="GSTNumber"
                        required
                        placeholder="Enter GST Number"
                        type="text"
                        className="form-control"
                        value={VendorData.GSTNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label>PAN Number</label>
                      <input
                        id="PANNumber"
                        required
                        placeholder="Enter PAN Number"
                        type="text"
                        className="form-control"
                        value={VendorData.PANNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-sm-6">
                      <label>Pan Card Document</label>
                      <div className="input-group">
                        <input
                          id="PANFileUrl"
                          name="DocumentPath"
                          required
                          placeholder="Select Pan Card Document"
                          type="file"
                          className="form-control"
                          onChange={handleFileChange}
                          accept=".pdf, .jpg, .jpeg, .png"
                        />
                        {selectedPANFile && (
                          <div className="input-group-append">
                            <span className="input-group-text">{selectedPANFile.name}</span>
                          </div>
                        )}
                      </div>
                      {VendorData.PANFileUrl && pageMode === "Edit" && !selectedPANFile && (
                        <small className="form-text text-muted">
                          Current document: {VendorData.PANFileUrl.substring(0, 50)}...
                        </small>
                      )}
                    </div>
                    <div className="col-sm-6">
                      <label>GST Document</label>
                      <div className="input-group">
                        <input
                          id="GSTCertificateUrl"
                          name="DocumentPath"
                          required
                          placeholder="Select GST Document"
                          type="file"
                          className="form-control"
                          onChange={handleFileChange}
                          accept=".pdf, .jpg, .jpeg, .png"
                        />
                        {selectedGSTFile && (
                          <div className="input-group-append">
                            <span className="input-group-text">{selectedGSTFile.name}</span>
                          </div>
                        )}
                      </div>
                      {VendorData.GSTCertificateUrl && pageMode === "Edit" && !selectedGSTFile && (
                        <small className="form-text text-muted">
                          Current document: {VendorData.GSTCertificateUrl.substring(0, 50)}...
                        </small>
                      )}
                    </div>
                    <div className="col-sm-6">
                      <label>Brochure</label>
                      <div className="input-group">
                        <input
                          id="BrochureUrl"
                          name="DocumentPath"
                          required
                          placeholder="Select Brochure"
                          type="file"
                          className="form-control"
                          onChange={handleFileChange}
                          accept=".pdf, .jpg, .jpeg, .png"
                        />
                        {selectedBrochureFile && (
                          <div className="input-group-append">
                            <span className="input-group-text">{selectedBrochureFile.name}</span>
                          </div>
                        )}
                      </div>
                      {VendorData.BrochureUrl && pageMode === "Edit" && !selectedBrochureFile && (
                        <small className="form-text text-muted">
                          Current document: {VendorData.BrochureUrl.substring(0, 50)}...
                        </small>
                      )}
                    </div>
                    <div className="col-sm-6">
                      <label>Website URL</label>
                      <input
                        id="WebsiteUrl"
                        required
                        placeholder="Enter Website URL"
                        type="text"
                        className="form-control"
                        value={VendorData.WebsiteUrl}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer justify-content-start">
                <Button Id="btnSave" Text="Save" Action={handleSave} ClassName="btn btn-primary" />
                <Button Id="btnCancel" Text="Cancel" Action={handleCancel} ClassName="btn btn-secondary" />
              </div>
              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </div>
          </div>
        </div>
      )}
      {pageMode === "View" && (
        <div className="modal d-flex align-items-center justify-content-center show" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">View Vendor</h5>
              </div>
              <div className="modal-body p-2 custom-transparent-scrollbar">
                <form>
                  <div className="row">
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">Name</label>
                      <input type="text" className="form-control" id="Name" value={VendorData.Name} readOnly />
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">Contact Person</label>
                      <input
                        type="text"
                        className="form-control"
                        id="ContactPerson"
                        value={VendorData.ContactPerson}
                        readOnly
                      />
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">Contact Number</label>
                      <input
                        type="text"
                        className="form-control"
                        id="ContactNumber"
                        value={VendorData.ContactNumber}
                        readOnly
                      />
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">Email</label>
                      <input type="text" className="form-control" id="Email" value={VendorData.Email} readOnly />
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">Address</label>
                      <input type="text" className="form-control" id="Address" value={VendorData.Address} readOnly />
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">GST Number</label>
                      <input
                        type="text"
                        className="form-control"
                        id="GSTNumber"
                        value={VendorData.GSTNumber}
                        readOnly
                      />
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">PAN Number</label>
                      <input
                        type="text"
                        className="form-control"
                        id="PANNumber"
                        value={VendorData.PANNumber}
                        readOnly
                      />
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">Pan Card</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          id="DocumentPath"
                          value={VendorData.PANFileUrl ? VendorData.PANFileUrl.split("/").pop() : ""}
                          readOnly
                        />
                        {VendorData.PANFileUrl && (
                          <div className="input-group-append">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => window.open(VendorData.PANFileUrl, "_blank")}>
                              View
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">GST Document</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          id="DocumentPath"
                          value={VendorData.GSTCertificateUrl ? VendorData.GSTCertificateUrl.split("/").pop() : ""}
                          readOnly
                        />
                        {VendorData.GSTCertificateUrl && (
                          <div className="input-group-append">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => window.open(VendorData.GSTCertificateUrl, "_blank")}>
                              View
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">Brochure</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          id="DocumentPath"
                          value={VendorData.BrochureUrl ? VendorData.BrochureUrl.split("/").pop() : ""}
                          readOnly
                        />
                        {VendorData.BrochureUrl && (
                          <div className="input-group-append">
                            <button type="button" className="btn btn-outline-secondary" onClick={() => window.open(VendorData.BrochureUrl, "_blank")}>
                              View
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group col-sm-6">
                      <label htmlFor="name">Website URL</label>
                      <input
                        type="text"
                        className="form-control"
                        id="WebsiteUrl"
                        value={VendorData.WebsiteUrl}
                        readOnly
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer justify-content-start">
                <Button Id="btnCancel" Text="Close" Action={handleCancel} ClassName="btn btn-secondary" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Vendor;