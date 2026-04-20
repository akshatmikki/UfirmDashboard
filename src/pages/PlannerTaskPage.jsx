import React, { Component } from 'react'
import { withRouter } from 'react-router-dom/cjs/react-router-dom.min';
import TaskList from '../MainComponents/Calendar/Tasks/TaskList';

class PlannerTaskPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      PageMode: 'Home',
      PageTitle: 'Tasks'
    };
  }

  render() {
    const { location } = this.props;
    const status = new URLSearchParams(location.search).get('status');
    const priority = new URLSearchParams(location.search).get('priority');
    const subCatId = new URLSearchParams(location.search).get('subCat');
    return (
      <div className='content-wrapper' style={{ zoom: 0.9 }}>
        <section className="content mt-4">
          <TaskList status={status} priority={priority} subCatId={subCatId} />

        </section>
      </div>
    );
  }
}

export default withRouter(PlannerTaskPage);