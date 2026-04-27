import React, { useState, useEffect } from "react";
import {fetchBranches, fetchCities, fetchProperties, fetchRoles, fetchUserTypes, submitUserForm} from "./createNewUserService";


const AddNewUser = () => {
    const [formData, setFormData] = useState({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        cityId: "",
        propertyId: "",
        roleId: "",
        branchId: "",
        userTypeId:"",
        profileImage: null,
    });

    const [cityNames, setCityNames] = useState([]);
    const [propertyNames, setPropertyNames] = useState([]);
    const [userRoles, setUserRoles] = useState([]);
    const [branches, setBranches] = useState([]);
    const [userTypes,setUserTypes]=useState([]);
    const [selectedPropertyIds, setSelectedPropertyIds] = useState([]);

    const selectedRole = userRoles.find((r) => String(r.UserRoleId) === String(formData.roleId));
    const isManager = (selectedRole?.UserRoleName ?? "").toLowerCase().includes("manager");
    const isPropertyDisabled =
        formData.roleId === "3" || formData.roleId === "4" || formData.roleId === "10";

    // Fetch dropdown data from API
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const cities = await fetchCities();
                setCityNames(cities);
            } catch (error) {
                console.error("Failed to fetch cities:", error);
            }

            try {
                const properties = await fetchProperties();
                setPropertyNames(properties);
            } catch (error) {
                console.error("Failed to fetch properties:", error);
            }

            try {
                const roles = await fetchRoles();
                setUserRoles(roles);
            } catch (error) {
                console.error("Failed to fetch roles:", error);
            }

            try {
                const branchData = await fetchBranches();
                setBranches(branchData);
            } catch (error) {
                console.error("Failed to fetch branches:", error);
            }
            try {
                const userTypeData = await fetchUserTypes();
                setUserTypes(userTypeData);
            } catch (error) {
                console.error("Failed to fetch branches:", error);
            }
        };

        fetchDropdownData();
    }, []);

    useEffect(() => {
        if (isPropertyDisabled) {
            if (selectedPropertyIds.length > 0) setSelectedPropertyIds([]);
            if (formData.propertyId !== "") setFormData((prev) => ({ ...prev, propertyId: "" }));
            return;
        }

        if (!isManager) {
            const single = selectedPropertyIds[0] ?? (formData.propertyId ? String(formData.propertyId).split(",")[0] : "");
            const next = single ? [single] : [];
            if (selectedPropertyIds.join(",") !== next.join(",")) setSelectedPropertyIds(next);
            if (formData.propertyId !== single) setFormData((prev) => ({ ...prev, propertyId: single }));
            return;
        }

        const parsed = formData.propertyId
            ? String(formData.propertyId)
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean)
            : [];
        const next = selectedPropertyIds.length > 0 ? selectedPropertyIds : parsed;
        const joined = next.join(",");
        if (selectedPropertyIds.join(",") !== next.join(",")) setSelectedPropertyIds(next);
        if (formData.propertyId !== joined) setFormData((prev) => ({ ...prev, propertyId: joined }));
    }, [isManager, isPropertyDisabled, formData.propertyId, selectedPropertyIds]);


    // Handle input changes for text fields and dropdowns
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePropertyChange = (e) => {
        if (isManager) {
            const values = Array.from(e.target.selectedOptions, (opt) => opt.value).filter(Boolean);
            setSelectedPropertyIds(values);
            setFormData((prev) => ({ ...prev, propertyId: values.join(",") }));
            return;
        }

        const value = e.target.value;
        setSelectedPropertyIds(value ? [value] : []);
        setFormData((prev) => ({ ...prev, propertyId: value }));
    };

    // Handle file input change
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData((prev) => ({ ...prev, profileImage: file }));
    };
    const handleReset = () => {
        setFormData({
            employeeId: "",
            firstName: "",
            lastName: "",
            email: "",
            phoneNumber: "",
            cityId: "",
            propertyId: "",
            roleId: "",
            branchId: "",
            userTypeId:"",
            profileImage: null,
        });
        setSelectedPropertyIds([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData); // Log form data for inspection

        try {
            const response = await submitUserForm(formData);
            console.log("User added successfully:", response);
            alert("User added successfully!");
            handleReset(); // Reset form after successful submission
        } catch (error) {
            console.error("Error adding user:", error);
            alert("Failed to add user. Please try again.");
        }
    };

    return (
        <div className="content-wrapper">
            <div className="content">
                <div className="section container-fluid card ">
                    <form onSubmit={handleSubmit} className="section">
                        <h4>Assign New User</h4>
                        <div className="row">
                            {/* Employee ID */}
                            <div className="form-group col-md-6">
                                <label>Employee ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="employeeId"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            {/* First Name */}
                            <div className="form-group col-md-6">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="row">
                            {/* Last Name */}
                            <div className="form-group col-md-6">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            {/* Email */}
                            <div className="form-group col-md-6">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="row">
                            {/* Phone Number */}
                            <div className="form-group col-md-6">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    // pattern="[0-9]{3}-[0-9]{2}-[0-9]{3}"
                                    className="form-control"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            {/* City Name Dropdown */}
                            <div className="form-group col-md-6">
                                <label>City Name</label>
                                <select
                                    className="form-control"
                                    name="cityId"
                                    value={formData.cityId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select City</option>
                                    {cityNames.map((city) => (
                                        <option key={city.CityId} value={city.CityId}>
                                            {city.CityName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="row">
                            {/* Role Name Dropdown */}
                            <div className="form-group col-md-6">
                                <label>Role Name</label>
                                <select
                                    className="form-control"
                                    name="roleId"
                                    value={formData.roleId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {userRoles.map((role) => (
                                        <option key={role.UserRoleId} value={role.UserRoleId}>
                                            {role.UserRoleName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Property Name Dropdown */}
                            <div className="form-group col-md-6">
                                <label>Property Name</label>
                                <select
                                    className="form-control"
                                    name="propertyId"
                                    value={isManager ? selectedPropertyIds : (selectedPropertyIds[0] ?? "")}
                                    onChange={handlePropertyChange}
                                    required
                                    multiple={isManager}
                                    size={isManager ? 6 : undefined}
                                    disabled={isPropertyDisabled}
                                >
                                    {!isManager && <option value="">Select Property</option>}
                                    {propertyNames.map((property) => (
                                        <option key={property.PropertyId} value={property.PropertyId}>
                                            {property.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="row">
                            {/* Branch Name Dropdown */}
                            <div className="form-group col-md-6">
                                <label>Branch Name</label>
                                <select
                                    className="form-control"
                                    name="branchId"
                                    value={formData.branchId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map((branch) => (
                                        <option key={branch.BranchId} value={branch.BranchId}>
                                            {branch.BranchName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* Profile Image Upload */}
                            <div className="form-group col-md-6">
                                <label>User Type</label>
                                <select
                                    className="form-control"
                                    name="userTypeId"
                                    value={formData.userTypeId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select User Type</option>
                                    {userTypes.map((userType) => (
                                        <option key={userType.UserTypeId} value={userType.UserTypeId}>
                                            {userType.UserTypeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="row">
                            <div className="form-group col-md-6">
                                <label>Profile Image</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    name="profileImage"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                            {/* Submit and Reset Buttons */}
                            <div className="form-group col-md-6">
                                <button type="submit" className="btn btn-primary mr-2">
                                    Submit
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={handleReset}>
                                    Reset
                                </button>
                            </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddNewUser;
