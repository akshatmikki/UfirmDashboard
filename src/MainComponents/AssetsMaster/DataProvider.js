import ServiceProvider from '../../Common/ServiceProvider.js';
let srv = new ServiceProvider();
const ASSET_API_BASE_URL = 'https://api.urest.in:8096/';
const MANAGE_ASSETS_URL = `${ASSET_API_BASE_URL}ManageAssets`;
class DataProvider {       
    manageDocumentTypeMaster(model,type) {
        let url = '';
        switch (type) {
            case 'I':
                return fetch(MANAGE_ASSETS_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(model[0])
                });
 
            case 'U':
                return fetch(MANAGE_ASSETS_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(model[0])
                });

            case 'D':
                return fetch(MANAGE_ASSETS_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(model[0])
                });

            case 'R':
                url = `GetAssets?propertyId=${model[0].propertyId}`;
                return srv.CallGetNewService(url);   
      
            default:
        }
    }   
}
export default DataProvider;
