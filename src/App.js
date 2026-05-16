// import React from 'react';
// import { Provider } from 'react-redux';
// import { store, history } from './redux/store';
// // import MainLayout from './Routing/MainNav';
// import LoginSelectorPage from './Routing/login/LoginSelectorPage';
// import './App.css';
// import 'primeicons/primeicons.css';
// import 'bootstrap/dist/css/bootstrap.min.css'


// function App() {
//   return (
//     <div className="App">
//       {/* <Provider store={store}> */}
//         {/* <MainLayout /> */}
//         <LoginSelectorPage />
//       {/* </Provider> */}
//     </div>
//   );
// }

// export default App;

















// import React from 'react';
// import { BrowserRouter } from 'react-router-dom';

// import LoginSelectorPage from './Routing/login/LoginSelectorPage';

// import './App.css';
// import 'primeicons/primeicons.css';
// import 'bootstrap/dist/css/bootstrap.min.css';

// function App() {
//   return (
//     <BrowserRouter>
//       <div className="App">
//         <LoginSelectorPage />
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;


















import React from 'react';
import { BrowserRouter, Switch, Route, Redirect } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import LoginSelectorPage from './Routing/login/LoginSelectorPage';
import PortalLoginPage from './Routing/login/PortalLoginPage';
import MainNav from './Routing/MainNav';
import ResetPasswordPage from './Routing/login/ResetPasswordPage';
import './App.css';
import 'primeicons/primeicons.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'admin-lte/dist/css/adminlte.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function PrivateRoute({ children, ...rest }) {
  const isLoggedIn = !!localStorage.getItem('accessToken');
  return (
    <Route
      {...rest}
      render={() => isLoggedIn ? children : <Redirect to="/login" />}
    />
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Switch>
          <Route exact path="/login" component={LoginSelectorPage} />
          <Route path="/login/:portal" component={PortalLoginPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <PrivateRoute path="/Account/App">
            <MainNav />
          </PrivateRoute>
          <Redirect from="/" to="/login" exact />
          <Redirect to="/login" />
        </Switch>
      </BrowserRouter>
    </Provider>
  );
}

export default App;