import {
    
    FETCH_DEPARTMENT,
    FETCH_USER,
    FETCH_PROPERTY_MEMBER,
    FETCH_USERTYPE,
    FETCH_OWNERTYPE,
    FETCH_RELATIONSHIPTYPE,
    FETCH_RESIDENTTYPE,
    ON_CLIENT_CHANGED,
    ON_PROPERTY_CHANGED,
    ON_USER_ROLE_CHANGED,
    FETCH_DASHBOARDDATES,
    SET_MANAGED_EMPLOYEES

} from './constants';
import { convertEsTojson } from '../../utility/common';

const initStateObj =
{
    userName: "",
    userEmail: "",
    userId: 0,
    companyid:0,
    puidn:0,
    puidnlist:[],
    entrolval:'User',
    dashDates:"",
    managedEmployees: [],
    managedEmployeeIds: [],
    managedEmployeesIsAdmin: false,
    managedEmployeesLoaded: false,
    managerFacilityMemberId: null
 
};

export default function commonreducer(state = initStateObj, action) {
    switch (action.type) {

        case FETCH_DEPARTMENT:
            {
                return {
                    ...state, productId: action.value
                }
            }
        case FETCH_USER:
        {
            return {
                ...state, userId: action.value
            }
        }
        case FETCH_PROPERTY_MEMBER:
        {
            return {
                ...state, userId: action.value
            }
        }
        case FETCH_USERTYPE:
        {
            return {
                ...state, userTypeId: action.value
            }
        }
        case FETCH_OWNERTYPE:
        {
            return {
                ...state, ownerTypeId: action.value
            }
        }
        case FETCH_RELATIONSHIPTYPE:
        {
            return {
                ...state, relationshipTypeId: action.value
            }
        }
        case FETCH_RESIDENTTYPE:
        {
            return {
                ...state, residentTypeId: action.value
            }
        }
        case ON_CLIENT_CHANGED:
            {
                return {
                    ...state, companyid: action.CompanyId
                }
            }
        case ON_PROPERTY_CHANGED:
            {
                const propertyIds = Array.isArray(action.PropertyIds)
                    ? action.PropertyIds
                    : (action.CompanyId ? [action.CompanyId] : []);
                return {
                    ...state, puidn: action.CompanyId, puidnlist: propertyIds
                }
            }
            case ON_USER_ROLE_CHANGED:
                {
                    return {
                        ...state, entrolval: action.UserRole
                    }
                }
                case FETCH_DASHBOARDDATES:
                    {
                        return{
                            ...state, dashDates:action.dashboardDates
                        }
                    }
                case SET_MANAGED_EMPLOYEES:
                    {
                        return {
                            ...state,
                            managedEmployees: Array.isArray(action.employees) ? action.employees : [],
                            managedEmployeeIds: Array.isArray(action.employeeIds) ? action.employeeIds : [],
                            managedEmployeesIsAdmin: !!action.isAdmin,
                            managedEmployeesLoaded: true,
                            managerFacilityMemberId: action.managerFacilityMemberId ?? null
                        }
                    }
        default:
            return state;
    }
}
