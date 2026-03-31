import React, { Component } from "react";
import MasterConfig from "../MainComponents/MasterConfig/MasterConfig";

class MasterConfigPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      PageMode: "Home",
      PageTitle: "Master Configuration",
    };
  }

  setPageTitle = (val) => {
    this.setState({ PageTitle: val });
  };

  setPageMode = (val) => {
    this.setState({ PageMode: val });
  };

  render() {
    return (
      <div className="content-wrapper">
        <section className="content">
          <div className="container-fluid">
            <MasterConfig
              PageMode={this.state.PageMode}
              PageTitle={this.state.PageTitle}
              setPageTitle={this.setPageTitle}
              setPageMode={this.setPageMode}
            />
          </div>
        </section>
      </div>
    );
  }
}

export default MasterConfigPage;
