const ApiConstants = {
  // New API Methods
  common: {
    fetchdepartment: {
      apiConfig: {
        url: 'Identity/Department/ListAll/{SearchValue}/{PageSize}/{PageNumber}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    saveDepartment: {
      apiConfig: {
        url: 'Identity/Department/Save',
        method: 'POST'
      },
      attachPrefix: true,
    },

    deleteDepartment: {
      apiConfig: {
        url: 'Identity/Department/Delete/{DepartmentId}',
        method: 'PUT'
      },
      attachPrefix: true,
    },

    fetchUser: {
      apiConfig: {
        url: 'Master/User/ListAll/{SearchValue}/{PageSize}/{PageNumber}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchPropertyMember: {
      apiConfig: {
        // Updated RG 2021/04/23 (Added PropertyId parameter into url)
        url: 'Property/PropertyMember/ListAll/{PropertyId}/{PropertyMemberType}/{SearchValue}/{PageSize}/{PageNumber}',
        // url: 'Property/PropertyMember/ListAll/{PropertyMemberType}/{SearchValue}/{PageSize}/{PageNumber}',
        method: 'GET'
      },
      attachPrefix: true,
    },

    saveUser: {
      apiConfig: {
        url: 'CreateNewUser',
        method: 'POST'
      },
      attachPrefix: true,
    },
    saveChangePassword: {
      apiConfig: {
        url: 'Identity/User/ChangePassword',
        method: 'POST'
      },
      attachPrefix: true,
    },
    deleteUser: {
      apiConfig: {
        url: 'Master/User/Delete/{UserId}',
        method: 'PUT'
      },
      attachPrefix: true,
    },
    deletePropertyMemberOwner: {
      apiConfig: {
        url: 'Property/PropertyMember/Delete/{PropertyMemberId}',
        method: 'PUT'
      },
      attachPrefix: true,
    },
    fetchUserType: {
      apiConfig: {
        url: 'Master/UserType/{UserTypeId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchOwnerType: {
      apiConfig: {
        url: 'Property/OwnerType/{OwnerTypeId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchRelationshipType: {
      apiConfig: {
        url: 'Property/RelationshipType/{RelationshipTypeId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchResidentType: {
      apiConfig: {
        url: 'Property/ResidentType/{ResidentTypeId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchPropertyMemberByPropertyDetailsID: {
      apiConfig: {
        url: 'Property/PropertyMemberByPropertyDetailsID/{PropertyDetailsId}/{IsOwner}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchDocumentType: {
      apiConfig: {
        url: 'Master/DocumentType/{DocumentTypeId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchProperty: {
      apiConfig: {
        url: 'Property/PropertyMaster/{PropertyId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchPropertyOwner: {
      apiConfig: {
        url: 'Property/PropertyOwner/{ParentMemberId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchPropertyName: {
      apiConfig: {
        url: 'Property/ParkingName/{ParkingAreaId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchCity: {
      apiConfig: {
        url: 'Master/City/{CityId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchUserById: {
      apiConfig: {
        url: 'Master/User/GetUserById/{UserId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchManagedEmployeesByIdentity: {
      apiConfig: {
        url: 'https://api.urest.in:8096/api/EmployeeAccess/GetManagedEmployeesByIdentity',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchBranch: {
      apiConfig: {
        url: 'Master/Branch/{CompanyId}/{BranchId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchDepartments: {
      apiConfig: {
        url: 'Master/Departments/{DepartmentsId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchUserRole: {
      apiConfig: {
        url: 'Master/UserRole/{UserRoleId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchVendor: {
      apiConfig: {
        url: 'Master/Vendor/{VendorId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
    fetchCompany: {
      apiConfig: {
        url: 'Master/Company/{CompanyId}',
        method: 'GET'
      },
      attachPrefix: true,
    },
  },

  // OLD API method

  catalog: {
    fetchEsQuery: {
      apiConfig: {
        url: 'elastic/{escode}/getESQuery',
        method: 'POST',
      },
      attachPrefix: true,
    },

    fetchStructures: {
      apiConfig: {

        url: 'elastic/{code}/getESQuery',
        method: 'POST',
      },
      attachPrefix: true,
    },

    fetchItems: {
      apiConfig: {
        url: 'item/{itemcode}/{tabname}',
        method: 'GET',
      },
      attachPrefix: true,
    },

    fetchCurrency: {
      apiConfig: {
        url: 'Catalog/Currency',
        method: 'GET',
      },
      attachPrefix: true,
    },

    fetchCountry: {
      apiConfig: {
        url: 'Catalog/Country',
        method: 'GET',
      },
      attachPrefix: true,
    },

    fetchMiniPrices: {
      apiConfig: {
        url: 'Catalog/{itemCodes}/ItemCostDetailsNew',
        method: 'GET',
      },
      attachPrefix: true,
    },

    insertError: {
      apiConfig: {
        url: 'Log/{errorMessage}/insertLog',
        method: 'POST',
      },
      attachPrefix: true,
    },

    requestMissingInformation: {
      apiConfig: {
        url: 'base/missingInformation',
        method: 'POST',
      },
      attachPrefix: true,
    },
    fetchDocumentFiles: {
      apiConfig: {
        url: 'Catalog/getDocumentDetails',
        method: 'POST',
      },
      attachPrefix: true,
    },
    productMedia: {
      apiConfig: {
        url: 'Catalog/{productId}/productMedia',
        method: 'GET',
      },
      attachPrefix: true,
    },
    productDocument: {
      apiConfig: {
        url: 'Catalog/{nodeId}/productDocument',
        method: 'GET',
      },
      attachPrefix: true,
    },
  },
};

export default ApiConstants;
