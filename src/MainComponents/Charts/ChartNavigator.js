// ChartNavigator.js
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { connect } from 'react-redux';
import departmentActions from '../../redux/department/action';
import { bindActionCreators } from 'redux';

const ChartNavigator = ({ dashDates, actions, onPeriodChange }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [initialDate, setInitialDate] = useState(new Date().toJSON().slice(0, 10));
  const [finalDate, setFinalDate] = useState(new Date().toJSON().slice(0, 10));

  useEffect(() => {
    //   console.log("Initial Date:", initialDate);
    //   console.log("Final Date:", finalDate);
    onPeriodChange(initialDate, finalDate);
    actions.fetchDashDates(initialDate);
  }, [initialDate, finalDate]);


  const handlePeriodChange = (period) => {

    const currentDate = new Date();
    if (period === "Today") {
      setInitialDate(currentDate.toJSON().slice(0, 10));
    }
    else if (period === "Week") {
      // Calculate date 7 days ago
      const priorDate = new Date();
      priorDate.setDate(currentDate.getDate() - 7);
      setInitialDate(priorDate.toJSON().slice(0, 10));
    } else if (period === "Month") {
      // Calculate date 30 days ago
      const priorDate = new Date();
      priorDate.setDate(currentDate.getDate() - 30);
      setInitialDate(priorDate.toJSON().slice(0, 10));
    } else if (period === "Year") {
      // Calculate date 365 days ago
      const priorDate = new Date();
      priorDate.setDate(currentDate.getDate() - 365);
      setInitialDate(priorDate.toJSON().slice(0, 10));
    }
    setSelectedPeriod(period);
  };

  return (
    <div className="chart-navigator-container d-flex align-items-center justify-content-center mb-1" style={{ gap: '15px' }}>
      <div className="chart-navigator">
        <div className="d-flex p-1 bg-light rounded-pill shadow-sm border" style={{ gap: '4px' }}>
          {["Today", "Week", "Month", "Year"].map((period) => (
            <button
              key={period}
              className={`btn btn-sm rounded-pill px-3 ${selectedPeriod === period ? "btn-success shadow-sm" : "btn-light text-secondary border-0"}`}
              style={{ 
                fontSize: '13px', 
                fontWeight: selectedPeriod === period ? '600' : '500',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onClick={() => handlePeriodChange(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      <div className="common-date-display text-muted small font-weight-bold p-2 px-3 bg-light rounded-pill shadow-sm border" style={{ letterSpacing: '0.5px', fontSize: '13px' }}>
        <i className="far fa-calendar-alt mr-2 text-success"></i>
        {initialDate} &nbsp; <span className="text-secondary opacity-50">&rarr;</span> &nbsp; {finalDate}
      </div>
    </div>
  );
};
function mapStateToProps(state, props) {
  return {
    dashDates: state.Commonreducer.dashDates,
  }
}
function mapDispatchToProps(dispatch) {
  const actions = bindActionCreators(departmentActions, dispatch);
  return { actions };
}
export default connect(mapStateToProps, mapDispatchToProps)(ChartNavigator);
