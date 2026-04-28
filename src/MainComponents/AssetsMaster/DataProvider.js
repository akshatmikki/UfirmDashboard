import ServiceProvider from '../../Common/ServiceProvider.js';
let srv = new ServiceProvider();
const LOCAL_MANAGE_ASSETS_URL = 'http://localhost:62929/ManageAssets';
class DataProvider {       
    manageDocumentTypeMaster(model,type) {
        let url = '';
        switch (type) {
            case 'I':
                return fetch(LOCAL_MANAGE_ASSETS_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(model[0])
                });
 
            case 'U':
                return fetch(LOCAL_MANAGE_ASSETS_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(model[0])
                });

            case 'D':
                return fetch(LOCAL_MANAGE_ASSETS_URL, {
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
