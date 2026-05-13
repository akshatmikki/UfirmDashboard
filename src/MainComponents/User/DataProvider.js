import ServiceProvider from '../../Common/ServiceProvider.js';
import * as appCommonJs from '../../Common/AppCommon.js';
import axios from 'axios';

let srv = new ServiceProvider();
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const BASE_URL = isLocal ? "http://localhost:62929/" : "https://api.urest.in:8096/";

class DataProvider {

    get(url) {
        return fetch(BASE_URL + url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + appCommonJs.getapitoken()
            },
        });
    }

    putJson(url, data) {
        return fetch(BASE_URL + url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + appCommonJs.getapitoken()
            },
            body: JSON.stringify(data)
        });
    }

    putUrl(url) {
        return fetch(BASE_URL + url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + appCommonJs.getapitoken()
            },
        });
    }

    saveUser(formdata) {
        let url = 'Master/User/Save';
        // If we are local, we might need to use the local BASE_URL for this too
        // or just fall back to srv if the old API is still there.
        // Assuming user wants everything in this provider to respect the new URLs.
        return axios.post(BASE_URL + url, formdata, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: 'Bearer ' + appCommonJs.getapitoken()
            }
        });
    }

    getAllUsers(propertyId = null, userId = null, isActive = null) {
        let url = `GetAllUsers?`;
        if (propertyId) url += `propertyId=${propertyId}&`;
        if (userId) url += `userId=${userId}&`;
        if (isActive !== null) url += `isActive=${isActive}`;
        return this.get(url);
    }

    updateUser(user) {
        let url = `UpdateUser`;
        return this.putJson(url, user);
    }

    deactivateUser(userId, updatedBy) {
        let url = `DeactivateUser?userId=${userId}&updatedBy=${updatedBy}`;
        return this.putUrl(url);
    }

}
export default DataProvider;