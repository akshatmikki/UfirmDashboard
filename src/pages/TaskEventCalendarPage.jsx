import React, { Component } from 'react';
import TaskEventCalendar from '../MainComponents/Calendar/TaskEvents/TaskEventCalendar';

class TaskEventCalendarPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            PageMode: 'Home',
            PageTitle: 'Task Event Calendar'
        };
    }

    render() {
        return (
            <div className="content-wrapper">
                <div className="content-header">
                    <div className="container-fluid" style={{ width: '90vw', margin: '0 auto' }}>
                        <div className="row mb-2">
                            <div className="col-sm-6">
                                <h1 className="m-0 text-dark">Task Event Calendar</h1>
                            </div>
                            <div className="col-sm-6">
                                <ol className="breadcrumb float-sm-right">
                                    <li className="breadcrumb-item"><a href="/">Home</a></li>
                                    <li className="breadcrumb-item active"><a href="/EventCalendar">Task Event Calendar</a> </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
                <section className="content">
                    <div className="container-fluid">
                        <TaskEventCalendar />
                    </div>
                </section>
            </div>
        );
    }
}

export default TaskEventCalendarPage;