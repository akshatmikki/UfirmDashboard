import {
    FETCH_DEPARTMENT,
    SAVE_DEPARTMENT,
    DELETE_DEPARTMENT,
    FETCH_USER,
    FETCH_PROPERTY_MEMBER,
    SAVE_USER,
    SAVE_CHANGEPASSWORD,
    DELETE_USER,
    DELETE_PROPERTYMEMBER,
    FETCH_USERTYPE,
    FETCH_OWNERTYPE,
    FETCH_RELATIONSHIPTYPE,
    FETCH_RESIDENTTYPE,
    FETCH_PROPERTYMEMBERBY_PROPERTYDETAILSID,
    FETCH_DOCUMENTTYPE,
    FETCH_PROPERTY,
    FETCH_PROPERTYOWNER,
    FETCH_PROPERTYNAME,
    FETCH_CITY,
    FETCH_USERBYID,
    FETCH_BRANCH,
    FETCH_DEPARTMENTS,
    FETCH_USERROLE,
    FETCH_VENDOR,
    FETCH_COMPANY,
    ON_CLIENT_CHANGED,
    ON_PROPERTY_CHANGED,
    ON_USER_ROLE_CHANGED,
    FETCH_DASHBOARDDATES,
    SET_MANAGED_EMPLOYEES
} from './constants';


// const fethcdepartment = (value) => {
//     type: FETCH_DEPARTMENT,
//         value
// }

const fetchDepartment = ({ promise, SearchValue, PageSize, PageNumber }) => (
    {
        type: FETCH_DEPARTMENT,
        promise,
        SearchValue,
        PageSize,
        PageNumber
    });

const saveDepartment = ({ promise, data }) => (
    {
        type: SAVE_DEPARTMENT,
        data,
        promise
    });

const deleteDepartment = ({ promise, departmentId }) => (
    {
        type: DELETE_DEPARTMENT,
        departmentId,
        promise
    });

const fetchUser = ({ promise, SearchValue, PageSize, PageNumber }) => (
    {
        type: FETCH_USER,
        promise,
        SearchValue,
        PageSize,
        PageNumber
    });

// 2021/04/23 Added PropertyId RG
const fetchPropertyMember = ({ promise, PropertyId, PropertyMemberType, SearchValue, PageSize, PageNumber }) => (
    {
        type: FETCH_PROPERTY_MEMBER,
        promise,
        PropertyId,
        PropertyMemberType,
        SearchValue,
        PageSize,
        PageNumber
    });

const saveUser = ({ promise, data }) => (
    {
        type: SAVE_USER,
        data,
        promise
    });

const saveChangePassword = ({ promise, data }) => (
    {
        type: SAVE_CHANGEPASSWORD,
        data,
        promise
    });

const deleteUser = ({ promise, userId }) => (
    {
        type: DELETE_USER,
        userId,
        promise
    });

const deletePropertyMemberOwner = ({ promise, propertyMemberId }) => (
    {
        type: DELETE_PROPERTYMEMBER,
        propertyMemberId,
        promise
    });

const fetchUserType = ({ promise, UserTypeId }) => (
    {
        type: FETCH_USERTYPE,
        promise,
        UserTypeId
    });

const fetchOwnerType = ({ promise, OwnerTypeId }) => (
    {
        type: FETCH_OWNERTYPE,
        promise,
        OwnerTypeId
    });

const fetchRelationshipType = ({ promise, RelationshipTypeId }) => (
    {
        type: FETCH_RELATIONSHIPTYPE,
        promise,
        RelationshipTypeId
    });

const fetchResidentType = ({ promise, ResidentTypeId }) => (
    {
        type: FETCH_RESIDENTTYPE,
        promise,
        ResidentTypeId
    });

const fetchPropertyMemberByPropertyDetailsID = ({ promise, PropertyDetailsId, IsOwner }) => (
    {
        type: FETCH_PROPERTYMEMBERBY_PROPERTYDETAILSID,
        promise,
        PropertyDetailsId,
        IsOwner
    });

const fetchDocumentType = ({ promise, DocumentTypeId }) => (
    {
        type: FETCH_DOCUMENTTYPE,
        promise,
        DocumentTypeId
    });

const fetchProperty = ({ promise, PropertyId }) => (
    {
        type: FETCH_PROPERTY,
        promise,
        PropertyId
    });

const fetchPropertyOwner = ({ promise, ParentMemberId }) => (
    {
        type: FETCH_PROPERTYOWNER,
        promise,
        ParentMemberId
    });

const fetchPropertyName = ({ promise, ParkingAreaId }) => (
    {
        type: FETCH_PROPERTYNAME,
        promise,
        ParkingAreaId
    });

const fetchCity = ({ promise, CityId }) => (
    {
        type: FETCH_CITY,
        promise,
        CityId
    });
const fetchUserById = ({ promise, UserId }) => (
    {
        type: FETCH_USERBYID,
        promise,
        UserId
    });
const fetchBranch = ({ promise, CompanyId, BranchId }) => (
    {
        type: FETCH_BRANCH,
        promise,
        CompanyId,
        BranchId
    });

const fetchUserRole = ({ promise, UserRoleId }) => (
    {
        type: FETCH_USERROLE,
        promise,
        UserRoleId
    });
const fetchDepartments = ({ promise, DepartmentsId }) => (
    {
        type: FETCH_DEPARTMENTS,
        promise,
        DepartmentsId
    });
const fetchVendor = ({ promise, VendorId }) => (
    {
        type: FETCH_VENDOR,
        promise,
        VendorId
    });
const fetchCompany = ({ promise, CompanyId }) => (
    {
        type: FETCH_COMPANY,
        promise,
        CompanyId
    });

const updateclient = ({ CompanyId }) => (
    {
        type: ON_CLIENT_CHANGED,
        CompanyId
    });

const updateproperty = ({ CompanyId, PropertyIds = [] }) => (
    {
        type: ON_PROPERTY_CHANGED,
        CompanyId,
        PropertyIds
    });

    const updateuserrole = ({ UserRole }) => (
        {
            type: ON_USER_ROLE_CHANGED,
            UserRole
        });

        const fetchDashDates = ( dashboardDates ) => {
            return {
              type: FETCH_DASHBOARDDATES,
              dashboardDates,
            };
          };

const setManagedEmployees = ({
    employees = [],
    employeeIds = [],
    isAdmin = false,
    managerFacilityMemberId = null
} = {}) => (
    {
        type: SET_MANAGED_EMPLOYEES,
        employees,
        employeeIds,
        isAdmin,
        managerFacilityMemberId
    }
);

    

const departmentActions = {
    fetchDepartment,
    saveDepartment,
    deleteDepartment,
    fetchUser,
    fetchPropertyMember,
    saveUser,
    saveChangePassword,
    deleteUser,
    deletePropertyMemberOwner,
    fetchUserType,
    fetchOwnerType,
    fetchRelationshipType,
    fetchResidentType,
    fetchPropertyMemberByPropertyDetailsID,
    fetchDocumentType,
    fetchProperty,
    fetchPropertyOwner,
    fetchPropertyName,
    fetchCity,
    fetchUserById,
    fetchBranch,
    fetchUserRole,
    fetchDepartments,
    fetchVendor,
    fetchCompany,
    updateclient,
    updateproperty,
    updateuserrole,
    fetchDashDates,
    setManagedEmployees
};

export default departmentActions;
