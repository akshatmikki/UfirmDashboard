import React, { useState, useEffect, useCallback } from 'react';
import swal from 'sweetalert';
import { ToastContainer } from 'react-toastify';
import DataGrid from '../../ReactComponents/DataGrid/DataGrid.jsx';
import Button from '../../ReactComponents/Button/Button';
import { CreateValidator, ValidateControls } from '../Calendar/Validation';
import * as appCommon from '../../Common/AppCommon.js';
import { DELETE_CONFIRMATION_MSG } from '../../Contants/Common';
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, PendingApprovalCategory } from "../../Services/InventoryService";
import { useSelector, useDispatch } from 'react-redux';
import ExportToCSV from '../../ReactComponents/ExportToCSV/ExportToCSV.js';
import ApprovalPage from './ApprovalPage';

const Category = (props) => {
    const [pageMode, setPageMode] = useState("Home");
    const [gridData, setGridData] = useState([]);
    const [GridApproval, setGridApproval] = useState([]);
    const gridHeader = [
        { sTitle: 'Id', titleValue: 'Id', "orderable": true },
        { sTitle: 'Name', titleValue: 'Name' },
        { sTitle: 'Description', titleValue: 'Description' },
        { sTitle: 'Action', titleValue: 'Action', Action: "Edit&View&Delete", Index: '0', "orderable": false },
    ];
    const propertyId = useSelector((state) => state.Commonreducer.puidn);
    const [loading, setLoading] = useState(false);
    const emptycategorydata = { Id: 0, Name: '', Description: '', propertyId: propertyId, IsApproved: false };
    const [categoryData, setCategoryData] = useState(emptycategorydata);
    const dispatch = useDispatch();

    const getPendingCategoryList = useCallback(async (propertyId) => {
        try {
            setLoading(true);
            const data = await PendingApprovalCategory(propertyId);
            setGridApproval(data?.Data || data || []);
            setLoading(false);
        } catch (error) {
            console.error('error fetching pending approval');
            setLoading(false);
        }
    }, []);

    const getCategoriesList = useCallback(async (propertyId) => {
        try {
            setLoading(true);
            const data = await getCategories(propertyId);
            setGridData(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching Categories:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (propertyId) {
            setGridData([]);
            setGridApproval([]);
            getPendingCategoryList(propertyId);
            getCategoriesList(propertyId);
        } else {
            setGridData([]);
            appCommon.showtextalert("Error", "Please Select a Property.", "error");
        }
    }, [getCategoriesList, getPendingCategoryList, propertyId]);

    const handleCreateCategory = async (newCategory) => {
        try {
            await createCategory(newCategory);
            appCommon.showtextalert("Category Saved Successfully!", "", "success");
            handleCancel();
            await getPendingCategoryList(propertyId);
            await getCategoriesList(propertyId);
        } catch (error) {
            appCommon.showtextalert("Error Creating Category", error.message, "error");
        }
    };

    const handleUpdateCategory = async (id, updatedCategory) => {
        try {
            await updateCategory(id, updatedCategory);
            appCommon.showtextalert("Category Updated Successfully!", "", "success");
            handleCancel();
            await getPendingCategoryList(propertyId);
            await getCategoriesList(propertyId);
        } catch (error) {
            appCommon.showtextalert("Error Updating Category", error.message, "error");
        }
    };

    const handleViewCategory = async (id) => {
        try {
            const data = await getCategoryById(id);
            setCategoryData(data);
        } catch (error) {
            appCommon.showtextalert("Error viewing Category", error.message, "error");
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await deleteCategory(id);
            appCommon.showtextalert("Category Deleted Successfully!", "", "success");
            await getPendingCategoryList(propertyId);
            await getCategoriesList(propertyId);
        } catch (error) {
            appCommon.showtextalert("Error Deleting Category", error.message, "error");
        }
    };

    const onPagechange = () => {
    };

    const onGridApprove = async (categoryApprovedId) => {
        try {
            const approvedCategory = GridApproval.find(item => item.Id === categoryApprovedId);
            if (approvedCategory) {
                const updatedCategory = { ...approvedCategory, IsApproved: true };
                await updateCategory(updatedCategory.Id, updatedCategory);
                appCommon.showtextalert("Category Approved Successfully!", "", "success");
                setGridApproval(prevData => prevData.filter(item => item.Id !== categoryApprovedId));
                await getCategoriesList(propertyId);
            }
        } catch (error) {
            appCommon.showtextalert("Error Approving Category", error.message, "error");
            console.error("Error approving category:", error);
        }
    };

    const onGridDelete = (categoryData) => {
        let myhtml = document.createElement("div");
        myhtml.innerHTML = DELETE_CONFIRMATION_MSG + "</hr>";
        swal({
            buttons: {
                ok: "Yes",
                cancel: "No",
            },
            content: myhtml,
            icon: "warning",
            closeOnClickOutside: false,
            dangerMode: true
        }).then((value) => {
            switch (value) {
                case "ok":
                    handleDeleteCategory(categoryData);
                    break;
                case "cancel":
                default:
                    break;
            }
        });
    };

    const onGridView = async (categoryData) => {
        setPageMode('View');
        CreateValidator();
        try {
            const categoryDetails = await getCategoryById(categoryData); 
            setCategoryData(categoryDetails);
        } catch (error) {
            console.error("Error fetching category details", error);
            appCommon.showtextalert("Error", "Failed to fetch category details.", "error");
        }
    };

    const onGridEdit = async (categoryData) => {
        setPageMode('Edit');
        CreateValidator();
        try {
            const categoryDetails = await getCategoryById(categoryData);
            setCategoryData(categoryDetails);
        } catch (error) {
            console.error("Error fetching category details", error);
            appCommon.showtextalert("Error", "Failed to fetch category details.", "error");
        }
    };

    const Addnew = () => {
        setPageMode('Add');
        CreateValidator();
        setCategoryData(emptycategorydata);
    };

    const handleSave = () => {
        if (ValidateControls()) {
            if (pageMode === "Add") {
                handleCreateCategory(categoryData);
            } else if (pageMode === "Edit") {
                handleUpdateCategory(categoryData.Id, categoryData);
            }
        }
    };

    const handleCancel = () => {
        setPageMode('Home');
        setCategoryData(emptycategorydata);
        getCategoriesList(propertyId);
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setCategoryData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    return (
        <>
            <div className="row">
                <div className="col-12">
                    {pageMode === "Home" && (
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
            {pageMode === 'Home' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex p-0">
                                <ul className="nav ml-auto tableFilterContainer">
                                    <li className="nav-item">
                                        <div className="input-group input-group-sm">
                                            <div className="input-group-prepend">
                                                <ExportToCSV data={gridData} className="btn btn-success btn-sm rounded mr-2" />
                                                <Button id="btnaddCalendarFrequency"
                                                    Action={Addnew}
                                                    ClassName="btn btn-success btn-sm rounded"
                                                    Icon={<i className="fa fa-plus" aria-hidden="true"></i>}
                                                    Text="Add Category" />
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div className="card-body pt-2">
                                <DataGrid
                                    Id="CategoryGrid"
                                    IsPagination={false}
                                    ColumnCollection={gridHeader}
                                    Onpageindexchanged={onPagechange}
                                    onEditMethod={onGridEdit}
                                    onGridDeleteMethod={onGridDelete}
                                    onGridViewMethod={onGridView}
                                    IsSarching={true}
                                    GridData={gridData}
                                    pageSize="2000" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {
                (pageMode === 'Add' || pageMode === 'Edit') && (
                    <div className="modal d-flex align-items-center justify-content-center show" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="exampleModalToggleLabel">
                                        {pageMode === 'Add' ? "Add Category" : "Edit Category"}
                                    </h5>
                                </div>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-12">
                                            <label htmlFor="Name">Category Name</label>
                                            <input
                                                id="Name"
                                                required
                                                placeholder="Enter Category Name"
                                                type="text"
                                                className="form-control"
                                                value={categoryData.Name}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                        <div className="col-12 mt-3">
                                            <label htmlFor="Description">Description</label>
                                            <input
                                                id="Description"
                                                required
                                                placeholder="Enter Description"
                                                type="text"
                                                className="form-control"
                                                value={categoryData.Description}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer justify-content-start">
                                    <Button Id="btnSave" Text="Save" Action={handleSave}
                                        ClassName="btn btn-primary" />
                                    <Button Id="btnCancel" Text="Cancel" Action={handleCancel}
                                        ClassName="btn btn-secondary" />
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
                    </div>
                )
            }
            {
                pageMode === 'View' && (
                    <div className="modal d-flex align-items-center justify-content-center show" tabIndex="-1" role="dialog">
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" >View Category</h5>
                                </div>
                                <div className="modal-body p-2">
                                    <form>
                                        <div className="row">
                                            <div className="form-group col-sm-6">
                                                <label htmlFor="viewName">Name:</label>
                                                <input type="text" className="form-control" id="viewName" value={categoryData.Name} readOnly />
                                            </div>
                                            <div className="form-group col-sm-6">
                                                <label htmlFor="viewDescription">Description:</label>
                                                <input type="text" className="form-control" id="viewDescription" value={categoryData.Description} readOnly />
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="modal-footer justify-content-start">
                                    <Button Id="btnClose" Text="Close" Action={handleCancel}
                                        ClassName="btn btn-secondary" />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Category;